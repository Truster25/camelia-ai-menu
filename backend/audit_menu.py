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
from printed_prices import PAGE, PRINTED_PRICES

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
                if name not in by_name:
                    verdict = "MISSING FROM THE MENU"
                print(f"{name:44s} {printed:>9,} {('' if site is None else format(site, ',')):>9s}  {verdict}")
        print()

    sections = defaultdict(int)
    for row in DISHES:
        sections[row["category"]] += 1

    print("=" * 66)
    print(f"printed menu       {len(PRINTED_PRICES)} dishes across {len(set(PAGE.values()))} photographed pages")
    print(f"the app serves     {len(DISHES)} dishes in {len(CATEGORIES)} sections")
    print("-" * 66)
    print(f"prices that agree  {len(PRINTED_PRICES) - len(wrong)}")
    print(f"prices that differ {len(wrong)}")
    print(f"printed but absent {len(missing)}")
    print(f"served but unprinted {len(extra)}")
    print("=" * 66)

    for name, site, printed in wrong:
        print(f"  DIFFERS  {name:44s} site {site:,}  printed {printed:,}")
    for name in missing:
        print(f"  MISSING  {name} (printed at {PRINTED_PRICES[name]:,})")
    for name in extra:
        print(f"  UNPRINTED  {name} ({by_name[name]['price']:,})")

    if wrong or missing or extra:
        return 1
    print("\nEvery price the app shows is a price on the printed menu.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
