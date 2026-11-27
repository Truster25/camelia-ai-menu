"""AI recommender — hybrid content-based ranking.

Four signals, normalised to 0-1 and combined with fixed weights:

    similarity 40%  TF-IDF + cosine similarity between the quiz text and each dish profile
    preference 25%  rule-based match of diet / spice / budget / cuisine
    popularity 20%  rating average (when present) blended with the demo popularity seed
    occasion   15%  dish occasion tags matched to the chosen occasion

Diet is applied as a hard eligibility filter *before* ranking, so an unsuitable
dish can never be recommended merely because it is popular (see BUILD-PLAN.md).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import Dish, Rating

WEIGHTS = {"similarity": 0.40, "preference": 0.25, "popularity": 0.20, "occasion": 0.15}

BUDGET_CEILING = {"low": 6000, "mid": 11000, "high": 100_000}
BUDGET_LABEL = {"low": "up to RWF 6,000", "mid": "RWF 6,000 – 11,000", "high": "no strict limit"}
BUDGET_SOFT_CEILING = {"low": 8500, "mid": 15000, "high": 100_000}

QUIZ_TEXT = {
    "diet": {
        "vegetarian": "vegetarian meat free garden greens vegetables plant",
        "vegan": "vegan plant based dairy free meat free",
        "halal": "halal",
        "gluten-free": "gluten free no wheat",
        "none": "open to everything",
    },
    "spice": {
        "mild": "mild gentle not spicy smooth",
        "medium": "medium balanced warm spice",
        "hot": "hot spicy chilli pepper strong",
    },
    "budget": {"low": "affordable inexpensive simple", "mid": "moderate mid range", "high": "premium special feast"},
    "cuisine": {
        "rwandan": "rwandan local kigali traditional",
        "african": "african east african regional",
        "international": "international continental italian asian",
        "any": "any cuisine",
    },
    "occasion": {
        "quick-bite": "quick snack coffee fast",
        "casual": "casual lunch everyday",
        "date": "date romantic intimate dinner",
        "celebration": "celebration party special treat",
        "family": "family sharing groups children",
    },
}

OCCASION_WORDS = {
    "quick-bite": "quick bite snack coffee solo light",
    "casual": "casual lunch everyday relaxed",
    "date": "date romantic intimate dinner evening",
    "celebration": "celebration special treat dessert festive",
    "family": "family sharing group platter generous",
}


@dataclass
class ScoredDish:
    dish: Dish
    score: float
    reason: str
    breakdown: dict[str, float] = field(default_factory=dict)
    badges: list[str] = field(default_factory=list)


def _dish_document(dish: Dish) -> str:
    """Text profile of a dish used for TF-IDF similarity."""
    dietary = []
    if dish.is_vegetarian:
        dietary.append("vegetarian meat free greens plant")
    if dish.is_vegan:
        dietary.append("vegan plant based dairy free")
    if dish.is_halal:
        dietary.append("halal")
    if dish.is_gluten_free:
        dietary.append("gluten free")
    spice_words = ["", "mild gentle", "medium balanced spice", "hot spicy chilli"]
    price_hint = "affordable inexpensive" if dish.price_rwf <= 6000 else "moderate mid range" if dish.price_rwf <= 11000 else "premium special"

    return " ".join(
        [
            dish.name,
            dish.description,
            dish.category.name if dish.category else "",
            dish.cuisine,
            dish.ingredients.replace(",", " "),
            " ".join(dietary),
            spice_words[dish.spice_level] if 0 <= dish.spice_level <= 3 else "",
            " ".join(dish.occasion_list),
            price_hint,
        ]
    ).lower()


def quiz_document(answers: dict[str, str]) -> str:
    parts = [QUIZ_TEXT[key][answers.get(key, default)] for key, default in (
        ("diet", "none"), ("spice", "mild"), ("budget", "mid"), ("cuisine", "any"), ("occasion", "casual")
    )]
    parts.append(OCCASION_WORDS.get(answers.get("occasion", "casual"), ""))
    return " ".join(parts).lower()


def is_eligible(dish: Dish, answers: dict[str, str]) -> bool:
    """Hard filters — a dish must never break a stated dietary requirement."""
    diet = answers.get("diet", "none")
    if diet == "vegetarian" and not dish.is_vegetarian:
        return False
    if diet == "vegan" and not dish.is_vegan:
        return False
    if diet == "halal" and not dish.is_halal:
        return False
    if diet == "gluten-free" and not dish.is_gluten_free:
        return False
    return dish.is_available


def _preference_score(dish: Dish, answers: dict[str, str]) -> tuple[float, list[str], list[str]]:
    """Rule score 0-1 plus human-readable reasons and badges."""
    points = 0.0
    total = 0.0
    reasons: list[str] = []
    badges: list[str] = []

    diet = answers.get("diet", "none")
    total += 1
    if diet == "vegetarian" and dish.is_vegetarian:
        points += 1
        reasons.append("vegetarian-friendly")
        badges.append("Vegetarian")
    elif diet == "vegan" and dish.is_vegan:
        points += 1
        reasons.append("fully plant-based")
        badges.append("Vegan")
    elif diet == "halal" and dish.is_halal:
        points += 1
        reasons.append("halal")
        badges.append("Halal")
    elif diet == "gluten-free" and dish.is_gluten_free:
        points += 1
        reasons.append("gluten-free")
        badges.append("Gluten free")
    elif diet == "none":
        points += 0.7

    # spice — closest match wins, distance penalised
    total += 1
    target = {"mild": 1, "medium": 2, "hot": 3}[answers.get("spice", "mild")]
    distance = abs(dish.spice_level - target)
    points += {0: 1.0, 1: 0.6, 2: 0.25}.get(distance, 0.0)
    if distance == 0:
        reasons.append({"mild": "mild spice level", "medium": "balanced medium spice", "hot": "properly hot"}[answers["spice"]])
    elif distance >= 2:
        reasons.append("gentler than your usual spice" if dish.spice_level < target else "bolder spice")

    # budget — within ceiling is best, soft ceiling partial credit
    total += 1
    budget = answers.get("budget", "mid")
    ceiling = BUDGET_CEILING[budget]
    soft = BUDGET_SOFT_CEILING[budget]
    if dish.price_rwf <= ceiling:
        points += 1
        if budget != "high":
            reasons.append(f"within your {BUDGET_LABEL[budget]} budget")
            badges.append("Within budget")
    elif dish.price_rwf <= soft:
        points += 0.45
    else:
        points += 0.1

    # cuisine
    total += 1
    cuisine = answers.get("cuisine", "any")
    if cuisine == "any":
        points += 0.8
    elif dish.cuisine.lower() == cuisine:
        points += 1
        reasons.append(f"{dish.cuisine} cuisine")
        badges.append(dish.cuisine)
    elif {dish.cuisine.lower(), cuisine} <= {"rwandan", "african"}:
        points += 0.7
        reasons.append("regional African flavours")

    return points / total, reasons, badges


def _popularity_score(dish: Dish, ratings: list[Rating]) -> float:
    """Bayesian-ish blend: real ratings dominate once enough exist, seed otherwise."""
    seed = dish.popularity_seed / 100
    dish_ratings = [r.stars for r in ratings if r.dish_id == dish.id]
    if not dish_ratings:
        return seed * 0.85
    average = sum(dish_ratings) / len(dish_ratings)  # 1-5
    confidence = min(len(dish_ratings) / 5, 1.0)     # 5 ratings == full confidence
    rating_component = (average / 5)
    return (rating_component * confidence) + (seed * (1 - confidence))


def _occasion_score(dish: Dish, answers: dict[str, str]) -> float:
    occasion = answers.get("occasion", "casual")
    tags = [tag.lower() for tag in dish.occasion_list]
    if occasion in tags:
        return 1.0
    related = {
        "quick-bite": {"casual"},
        "casual": {"quick-bite", "family"},
        "date": {"celebration"},
        "celebration": {"date", "family"},
        "family": {"casual", "celebration"},
    }[occasion]
    if related & set(tags):
        return 0.6
    return 0.25


def recommend(
    dishes: list[Dish],
    ratings: list[Rating],
    answers: dict[str, str],
    limit: int = 5,
) -> tuple[list[ScoredDish], list[str], int]:
    """Rank dishes for the quiz answers. Returns (results, filters_applied, considered)."""
    filters_applied: list[str] = []
    diet = answers.get("diet", "none")
    if diet != "none":
        filters_applied.append({"vegetarian": "Vegetarian only", "vegan": "Vegan only",
                                "halal": "Halal only", "gluten-free": "Gluten-free only"}[diet])

    eligible = [d for d in dishes if is_eligible(d, answers)]
    considered = len(eligible)
    if not eligible:
        return [], filters_applied, 0

    corpus = [_dish_document(d) for d in eligible]
    vectoriser = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
    matrix = vectoriser.fit_transform(corpus + [quiz_document(answers)])
    similarities = cosine_similarity(matrix[-1], matrix[:-1]).flatten()

    scored: list[ScoredDish] = []
    for index, dish in enumerate(eligible):
        preference, reasons, badges = _preference_score(dish, answers)
        popularity = _popularity_score(dish, ratings)
        occasion = _occasion_score(dish, answers)
        similarity = float(similarities[index])
        # Cosine values are small on short texts; scale so a good match reads well.
        similarity_norm = min(similarity / 0.35, 1.0)

        breakdown = {
            "similarity": round(similarity_norm * 100, 1),
            "preference": round(preference * 100, 1),
            "popularity": round(popularity * 100, 1),
            "occasion": round(occasion * 100, 1),
        }
        total = (
            WEIGHTS["similarity"] * similarity_norm
            + WEIGHTS["preference"] * preference
            + WEIGHTS["popularity"] * popularity
            + WEIGHTS["occasion"] * occasion
        ) * 100

        reason_bits = reasons[:2] or ["a well-loved Camelia plate"]
        if occasion == 1.0:
            reason_bits.append(f"great for {answers.get('occasion', 'casual').replace('-', ' ')}")
        if dish.rating_count >= 3 and dish.rating_average >= 4:
            reason_bits.append(f"rated {dish.rating_average:.1f}★ by {dish.rating_count} guests")
        if dish.is_signature:
            badges.append("Signature")

        scored.append(
            ScoredDish(
                dish=dish,
                score=round(total, 1),
                reason="Matched because it is " + ", ".join(dict.fromkeys(reason_bits)) + ".",
                breakdown=breakdown,
                badges=list(dict.fromkeys(badges)),
            )
        )

    scored.sort(key=lambda item: (-item.score, item.dish.price_rwf))
    return scored[:limit], filters_applied, considered


def explain_weights() -> dict[str, float]:
    return WEIGHTS


# ---------------------------------------------------------------------------
# Natural-language search
# ---------------------------------------------------------------------------
# The same ranker, reached by a different door.
#
# The quiz asks five structured questions. This takes free text: "something warm
# no meat under six thousand". Rather than build a second model, the text is
# parsed into the very answers the quiz would have produced, and the existing
# ranker scores the menu as usual.
#
# That choice matters beyond saving work. It means the search box cannot give a
# different answer from the quiz, and every rule the quiz enforces, hard dietary
# filters included, is enforced here too, for free.
#
# It is deliberately not a language model. It reads for known words and phrases.
# A phrase it does not recognise falls through to plain text similarity over the
# dish descriptions, which is what the recommender already does well. Pretending
# to understand more than that would be dishonest and would fail in front of a
# panel the first time somebody typed something unexpected.

# Words that map onto a quiz answer. Order matters: the first match wins.
#
# Every value here must exist in QUIZ_TEXT. That is not a style preference: the
# ranker looks the value up in a fixed vocabulary, so an invented value raises
# KeyError and the request dies with a 500. "coffee" was mapped to a cuisine
# called "coffee" which the model has never heard of, and typing the word
# coffee crashed the search. Values are now drawn only from what QUIZ_TEXT and
# is_eligible actually accept.
_DIET_WORDS: list[tuple[tuple[str, ...], str]] = [
    (("vegan", "plant based", "plant-based", "dairy free", "no dairy"), "vegan"),
    (("vegetarian", "no meat", "meat free", "meat-free", "veggie", "veggies"), "vegetarian"),
    (("halal",), "halal"),
    (("gluten free", "gluten-free", "no gluten", "coeliac", "celiac"), "gluten-free"),
]

_SPICE_WORDS: list[tuple[tuple[str, ...], str]] = [
    (("very hot", "extra hot", "spicy", "hot", "chilli", "chili", "pili"), "hot"),
    (("mild", "not spicy", "no spice", "gentle", "plain"), "mild"),
    (("medium", "some heat", "a bit spicy", "slightly spicy"), "medium"),
]

_BUDGET_WORDS: list[tuple[tuple[str, ...], str]] = [
    (("cheap", "cheapest", "budget", "affordable", "low price", "under 6", "less than 6", "student"), "low"),
    (("expensive", "splash out", "treat", "celebration", "premium", "high end"), "high"),
    (("mid", "moderate", "reasonable", "middle"), "mid"),
]

# The model's occasions: quick-bite, casual, date, celebration, family.
_OCCASION_WORDS: list[tuple[tuple[str, ...], str]] = [
    (("date", "date night", "romantic", "anniversary", "partner"), "date"),
    (("family", "kids", "children", "group"), "family"),
    (("quick", "fast", "in a hurry", "lunch break", "takeaway", "to go", "snack"), "quick-bite"),
    (("celebration", "birthday", "party", "special occasion", "anniversary dinner"), "celebration"),
    (("business", "meeting", "client", "work lunch"), "casual"),
]

# The model's cuisines: rwandan, african, international, any.
_CUISINE_WORDS: list[tuple[tuple[str, ...], str]] = [
    (("rwandan", "local", "traditional", "kinyarwanda", "ugali", "isombe", "matooke"), "rwandan"),
    (("african", "east african", "ugandan", "kenyan", "brochette", "nyama"), "african"),
    (("italian", "pasta", "pizza", "pizza", "western", "european", "burger", "sandwich",
      "salad", "cake", "dessert", "coffee", "espresso", "latte", "cappuccino",
      "juice", "smoothie", "mocha", "tea", "breakfast"), "international"),
]


# Negated food words. "no meat" must not read as "meat", or a vegetarian gets
# sent to the grill. Anything here is removed before the cuisine scan runs.
_NEGATIONS = ("no meat", "meat free", "meat-free", "without meat", "no fish",
              "no chicken", "not spicy", "no spice", "no dairy", "no gluten")


# Words that describe a kind of dish but are not a quiz answer. They are used to
# boost dishes whose category, name or description matches, which is what makes
# "something for breakfast" return breakfast rather than cake.
_CATEGORY_HINTS: dict[str, tuple[str, ...]] = {
    "breakfast": ("breakfast", "omelette", "breakfast"),
    "lunch": ("light dishes", "sandwiches", "burgers", "soups"),
    "dinner": ("kingsize meals", "asian curries", "mexican & pilau"),
    "dessert": ("desserts & pastry",),
    "cake": ("desserts & pastry",),
    "juice": ("fresh juices",),
    "shake": ("smoothies & shakes",),
    "smoothie": ("smoothies & shakes",),
    "coffee": ("coffee",),
    "tea": ("tea",),
    "soup": ("soups",),
    "salad": ("salads",),
    "burger": ("burgers",),
    "sandwich": ("sandwiches",),
    "curry": ("asian curries",),
    "grilled": ("kingsize meals", "light dishes"),
    "meat": ("kingsize meals", "burgers", "asian curries"),
    "chicken": ("kingsize meals", "asian curries", "burgers"),
    "fish": ("kingsize meals", "asian curries", "burgers"),
    "beef": ("kingsize meals", "asian curries", "burgers"),
    "vegetarian": ("salads", "soups"),
    "spicy": ("asian curries", "mexican & pilau"),
}


def _scan(text: str, table: list[tuple[tuple[str, ...], str]]) -> str | None:
    for phrases, value in table:
        for phrase in phrases:
            if phrase in text:
                return value
    return None


def _scan_cuisine(text: str) -> str | None:
    """Cuisine last, and with negated phrases stripped first.

    Diet and heat are read before this runs, so "no meat" has already been
    understood as vegetarian by the time the word "meat" would be mistaken for a
    preference for grilled food.
    """
    cleaned = text
    for phrase in _NEGATIONS:
        cleaned = cleaned.replace(phrase, " ")
    return _scan(cleaned, _CUISINE_WORDS)


def parse_free_text(query: str) -> tuple[dict[str, str], list[str]]:
    """Turn a sentence into quiz answers plus a note of what was understood.

    The second value is not decoration: the interface shows it back to the
    customer ("read as: vegan, mild") so the answer is never a black box. If the
    parse is wrong, they can see that it is wrong and correct it.
    """
    text = f" {query.lower().strip()} "
    understood: list[str] = []
    answers = {"diet": "none", "spice": "medium", "budget": "mid", "cuisine": "any", "occasion": "casual"}

    for key, table, label in (
        ("diet", _DIET_WORDS, "diet"),
        ("spice", _SPICE_WORDS, "heat"),
        ("budget", _BUDGET_WORDS, "budget"),
        ("occasion", _OCCASION_WORDS, "occasion"),
        ("cuisine", _CUISINE_WORDS, "cuisine"),
    ):
        found = _scan_cuisine(text) if key == "cuisine" else _scan(text, table)
        if found:
            answers[key] = found
            understood.append(f"{label}: {found.replace('-', ' ')}")

    return answers, understood
