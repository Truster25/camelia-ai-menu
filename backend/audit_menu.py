"""Check the menu against the printed prices, and show the work.

    python audit_menu.py            summary and any disagreement
    python audit_menu.py --all      every dish, with the page it came from
    python audit_menu.py --page 6   only the dishes transcribed from page 6

The point of this script is not that it passes. The point is that it prints
each dish beside the printed price and the page the price was read from, so a
person can look at the photograph of that page and disagree with it. A check
nobody can audit is only a claim.

Exit code is 1 if anything disagrees, so it can gate a build.
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict

from menu_data import CATEGORIES, DISHES
from printed_prices import PAGE, PRINTED_PRICES, UNCONFIRMED_PRICES

PAGE_TITLES = {
    1: "Soups, Salad Zone, Local fresh fruits",
    2: "Light Dishes",
    3: "Burgers & Sandwiches",
    4: "Kingsize, Mexican, Pilau, Asian",
    5: "Juices, Smoothies, Shakes, Mojito",
    6: "Coffee, Iced Frappes, Teas, Breakfast, Pastry, Drinks",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--all", action="store_true", help="list every dish")
    parser.add_argument("--page", type=int, help="only this printed page")
    args = parser.parse_args()

    by_name = {row["name"]: row for row in DISHES}

    missing = sorted(name for name in PRINTED_PRICES if name not in by_name)
    extra = sorted(name for name in by_name if name not in PRINTED_PRICES)
    wrong = sorted(
        (name, by_name[name]["price"], PRINTED_PRICES[name])
        for name in PRINTED_PRICES
        if name in by_name and by_name[name]["price"] != PRINTED_PRICES[name]
    )

    if args.all or args.page:
        groups: dict[int, list[str]] = defaultdict(list)
        for name in PRINTED_PRICES:
            groups[PAGE.get(name, 0)].append(name)
        for page in sorted(groups):
            if args.page and page != args.page:
                continue
            print(f"\nPage {page}: {PAGE_TITLES.get(page, 'unmapped')}")
            print(f"{'dish':44s} {'printed':>9s} {'site':>9s}  verdict")
            for name in sorted(groups[page], key=lambda n: PRINTED_PRICES[n]):
                printed = PRINTED_PRICES[name]
                site = by_name[name]["price"] if name in by_name else None
                verdict = "ok" if site == printed else f"DISAGREES ({site})"
                if site == printed and name in UNCONFIRMED_PRICES:
                    verdict = "carried forward; photo cropped"
                if name not in by_name:
                    verdict = "MISSING FROM THE MENU"
                print(f"{name:44s} {printed:>9,} {('' if site is None else format(site, ',')):>9s}  {verdict}")
        print()

    sections = defaultdict(int)
    for row in DISHES:
        sections[row["category"]] += 1

    print("=" * 66)
    print(f"price reference    {len(PRINTED_PRICES)} entries across {len(set(PAGE.values()))} photographed pages")
    print(f"the app serves     {len(DISHES)} dishes in {len(CATEGORIES)} sections")
    print("-" * 66)
    print(f"prices that agree  {len(PRINTED_PRICES) - len(wrong)}")
    print(f"prices that differ {len(wrong)}")
    print(f"recorded but absent {len(missing)}")
    print(f"served but unprinted {len(extra)}")
    print("=" * 66)

    for name, site, printed in wrong:
        print(f"  DIFFERS  {name:44s} site {site:,}  printed {printed:,}")
    for name in missing:
        print(f"  MISSING  {name} (printed at {PRINTED_PRICES[name]:,})")
    for name in extra:
        print(f"  UNPRINTED  {name} ({by_name[name]['price']:,})")
    for name in sorted(UNCONFIRMED_PRICES):
        print(f"  PRICE TO CONFIRM  {name} (kept at {PRINTED_PRICES[name]:,} RWF)")

    # ---- photography, dietary labels and the written record ----
    import re
    from pathlib import Path

    import seed
    from menu_data import DISHES as menu

    print()
    root = Path(__file__).resolve().parent.parent
    public = root / "frontend" / "public"
    missing_images = []
    for row in menu:
        image_url = seed.dish_photo(row["name"])
        if not (public / image_url.lstrip("/")).is_file():
            missing_images.append((row["name"], image_url))
    print(f"dish images        {len(menu) - len(missing_images)} of {len(menu)} files present")
    for name, url in missing_images:
        print(f"  MISSING IMAGE  {name}: {url}")

    meat_words = ("beef", "chicken", "fish", "pork", "bacon", "ham", "sausage",
                  "mince", "steak", "nugget", "wing", "fillet", "stroganoff", "hotpot")
    gluten_words = ("bread", "pasta", "spaghetti", "baguette", "chapati", "bun",
                    "tortilla", "croissant", "cake", "batter", "flour", "noodle",
                    "sandwich", "cracker", "cookie", "pastry")

    label_faults = []
    for row in menu:
        ing = row["ingredients"].lower()
        if row["is_vegetarian"] and any(w in ing for w in meat_words):
            label_faults.append(f"vegetarian but lists meat: {row['name']}")
        if row["is_gluten_free"] and any(w in ing for w in gluten_words):
            label_faults.append(f"gluten free but lists wheat: {row['name']}")
        if row["is_vegan"] and not row["is_vegetarian"]:
            label_faults.append(f"vegan but not vegetarian: {row['name']}")
        if row["is_halal"]:
            label_faults.append(f"claims halal before Camelia confirmed it: {row['name']}")
    print(f"dietary labels     {'consistent with their ingredients' if not label_faults else str(len(label_faults)) + ' FAULT(S)'}")
    for fault in label_faults:
        print(f"  {fault}")

    # The documents must not disagree with the menu about its own size.
    stale = []
    for doc in list((root / "docs").glob("*.md")) + [root / "README.md"]:
        # The dietary review counts how many dishes carry each label, which is
        # a different number from the size of the menu.
        if doc.name == "DIETARY-REVIEW.md":
            continue
        text = doc.read_text(encoding="utf-8")
        # Only claims about the size of the whole menu. The dietary review
        # counts how many dishes carry a label, which is a different number.
        for found in re.findall(r"(?<![\d,.])(\d{2,3}) dishes(?: in| across| on|,|\b)", text):
            if int(found) != len(menu):
                stale.append(f"{doc.name} says {found} dishes, the menu has {len(menu)}")
        for found in re.findall(r"\b(\d{1,2}) sections\b", text):
            if int(found) != len(CATEGORIES):
                stale.append(f"{doc.name} says {found} sections, there are {len(CATEGORIES)}")
    print(f"written record     {'agrees with the menu' if not stale else str(len(stale)) + ' STALE CLAIM(S)'}")
    for item in stale:
        print(f"  {item}")

    problems = bool(wrong or missing or extra or missing_images or label_faults or stale)
    print()
    if problems:
        print("NOT SETTLED. See the lines above.")
        return 1
    print("The catalog matches the price reference, and its image files are present.")
    print("The dietary and document consistency checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
