"""API and recommendation tests.

Run from `backend/`:  pytest -q
Uses a throwaway SQLite file so the developer's local database is never touched.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

TMP_DB = Path(tempfile.gettempdir()) / "camelia_test.db"
if TMP_DB.exists():
    TMP_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TMP_DB}"
os.environ["AUTO_SEED"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.recommender import is_eligible, recommend  # noqa: E402

ADMIN = {"email": "admin@camelia.rw", "password": "Admin123"}
CUSTOMER = {"email": "customer@camelia.rw", "password": "Customer123"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:  # triggers lifespan => creates + seeds tables
        yield test_client


@pytest.fixture(scope="module")
def admin_headers(client):
    token = client.post("/api/auth/login", json=ADMIN).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def customer_headers(client):
    token = client.post("/api/auth/login", json=CUSTOMER).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --------------------------------------------------------------------- basics


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_legacy_menu_endpoint_keeps_its_shape(client):
    body = client.get("/api/menu").json()
    assert len(body["items"]) >= 20
    assert all(item["price_rwf"] > 0 for item in body["items"])


def test_menu_is_seeded_with_the_real_camellia_menu(client):
    categories = client.get("/api/categories").json()
    dishes = client.get("/api/dishes").json()
    # 16 sections, transcribed from the printed menu.
    assert len(categories) == 16
    assert len(dishes) == 130
    assert {d["category_name"] for d in dishes} == {c["name"] for c in categories}


def test_dish_filters(client):
    vegan = client.get("/api/dishes?diet=vegan").json()
    assert vegan and all(d["is_vegan"] for d in vegan)

    cheap = client.get("/api/dishes?max_price=5000").json()
    assert cheap and all(d["price_rwf"] <= 5000 for d in cheap)

    found = client.get("/api/dishes?search=steak").json()
    assert any("Steak" in d["name"] for d in found)


@pytest.mark.parametrize(
    "diet,flag",
    [
        ("vegan", "is_vegan"),
        ("vegetarian", "is_vegetarian"),
        ("gluten-free", "is_gluten_free"),
    ],
)
def test_each_diet_filter_returns_the_dishes_that_carry_it(client, diet, flag):
    """A filter that returns nothing looks identical to a filter with no matches.

    The gluten-free filter once returned an empty menu even though the menu data
    marked 63 dishes, because the database had been seeded before those labels
    existed and nothing reconciled the two. Only the vegan filter was tested, so
    the other two could break in silence. Every filter is now checked against
    the menu itself.
    """
    from menu_data import DISHES

    expected = sum(1 for row in DISHES if row[flag])
    assert expected > 0, f"the menu marks no dish {diet}; the filter would look broken"

    returned = client.get(f"/api/dishes?diet={diet}").json()
    assert len(returned) == expected, f"{diet} returned {len(returned)} of {expected}"
    assert all(dish[flag] for dish in returned)


def test_halal_filter_is_honest_while_unconfirmed(client):
    """Until Camellia confirms certification, the halal filter returns nothing.

    That is the safe failure and it is deliberate. This test exists so nobody
    "fixes" it by marking dishes halal to make the demo look fuller: a wrong
    halal claim is the one bug a restaurant cannot forgive.
    """
    halal = client.get("/api/dishes?diet=halal").json()
    assert halal == [], "nothing may be marked halal until the restaurant confirms it"

    quiz = {"diet": "halal", "spice": "mild", "budget": "mid", "cuisine": "any", "occasion": "casual"}
    body = client.post("/api/recommend", json=quiz).json()
    assert body["results"] == []
    assert body["filters_applied"], "the customer should be told a filter was applied"


def test_unknown_dish_returns_404(client):
    assert client.get("/api/dishes/99999").status_code == 404


# ----------------------------------------------------------------------- auth


def test_register_and_login(client):
    payload = {"name": "Test Guest", "email": "test.guest@example.rw", "password": "secret123"}
    created = client.post("/api/auth/register", json=payload)
    assert created.status_code == 201
    assert created.json()["user"]["role"] == "customer"

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 409

    token = created.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email"] == payload["email"]


def test_self_registration_cannot_create_an_admin(client):
    """Registration rejects a role rather than quietly accepting and ignoring it.

    The old behaviour was 201 with the role downgraded to customer. That is
    arguably worse than a refusal: the caller is told the request succeeded, so a
    bug that depended on the role fails silently somewhere else later. 422 says
    plainly that this endpoint does not take a role at all.
    """
    payload = {"name": "Sneaky", "email": "sneaky@example.rw", "password": "secret123", "role": "admin"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_bad_password_is_rejected(client):
    assert client.post("/api/auth/login", json={**CUSTOMER, "password": "nope"}).status_code == 401


def test_protected_routes_require_a_token(client):
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/admin/orders").status_code == 401


def test_customer_cannot_reach_admin_routes(client, customer_headers):
    assert client.get("/api/admin/orders", headers=customer_headers).status_code == 403
    assert client.get("/api/admin/analytics", headers=customer_headers).status_code == 403


# ------------------------------------------------------------ recommendations


def test_recommend_returns_five_ranked_dishes(client):
    quiz = {"diet": "none", "spice": "mild", "budget": "low", "cuisine": "rwandan", "occasion": "casual"}
    body = client.post("/api/recommend", json=quiz).json()
    assert len(body["results"]) == 5
    scores = [row["score"] for row in body["results"]]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= score <= 100 for score in scores)
    assert all(row["reason"] for row in body["results"])
    assert body["log_id"] is not None
    total = sum(row["score_breakdown"]["similarity"] for row in body["results"])
    assert total > 0, "TF-IDF similarity must contribute to the scores"


def test_vegetarian_quiz_never_returns_meat(client):
    quiz = {"diet": "vegetarian", "spice": "medium", "budget": "high", "cuisine": "any", "occasion": "date"}
    body = client.post("/api/recommend", json=quiz).json()
    assert body["results"]
    assert all(row["dish"]["is_vegetarian"] for row in body["results"])
    assert body["filters_applied"] == ["Vegetarian only"]


def test_vegan_and_gluten_free_quizzes_respect_the_filter(client):
    vegan = client.post("/api/recommend", json={"diet": "vegan"}).json()
    assert vegan["results"] and all(row["dish"]["is_vegan"] for row in vegan["results"])

    gf = client.post("/api/recommend", json={"diet": "gluten-free"}).json()
    assert gf["results"] and all(row["dish"]["is_gluten_free"] for row in gf["results"])


def test_halal_quiz_excludes_pork_dishes(client):
    body = client.post("/api/recommend", json={"diet": "halal", "spice": "medium", "budget": "high"}).json()
    names = {row["dish"]["name"] for row in body["results"]}
    assert "Akabenzi Omelette" not in names
    assert "Camelia Big Breakfast" not in names


def test_budget_influences_ranking(client):
    """A low-budget quiz must not be topped by an expensive plate."""
    body = client.post("/api/recommend", json={"diet": "none", "budget": "low", "spice": "mild"}).json()
    assert body["results"][0]["dish"]["price_rwf"] <= 9500


def test_eligibility_rules_are_pure_functions():
    class FakeDish:
        def __init__(self, **kwargs):
            self.is_available = True
            self.is_vegetarian = False
            self.is_vegan = False
            self.is_halal = True
            self.is_gluten_free = False
            self.__dict__.update(kwargs)

    pork = FakeDish(is_halal=False)
    assert is_eligible(pork, {"diet": "halal"}) is False
    assert is_eligible(pork, {"diet": "none"}) is True

    meat = FakeDish(is_vegetarian=False)
    assert is_eligible(meat, {"diet": "vegetarian"}) is False

    hidden = FakeDish(is_available=False)
    assert is_eligible(hidden, {"diet": "none"}) is False


def test_recommender_handles_an_empty_menu():
    ranked, filters, considered = recommend([], [], {"diet": "vegan"})
    assert ranked == [] and considered == 0


def test_quiz_meta_exposes_weights(client):
    meta = client.get("/api/recommend/meta").json()
    assert meta["weights"] == {"similarity": 0.4, "preference": 0.25, "popularity": 0.2, "occasion": 0.15}
    assert sum(meta["weights"].values()) == pytest.approx(1.0)
    assert len(meta["options"]["diet"]) == 5


# -------------------------------------------------------------------- ratings


def test_customer_can_rate_a_dish_once(client, customer_headers):
    dish_id = client.get("/api/dishes").json()[0]["id"]
    first = client.post(f"/api/dishes/{dish_id}/ratings", json={"stars": 5, "comment": "Excellent"}, headers=customer_headers)
    assert first.status_code == 200
    second = client.post(f"/api/dishes/{dish_id}/ratings", json={"stars": 3, "comment": "Changed my mind"}, headers=customer_headers)
    assert second.status_code == 200
    mine = [r for r in client.get(f"/api/dishes/{dish_id}/ratings").json() if r["user_name"] == "Aline Mukamana"]
    assert len(mine) == 1 and mine[0]["stars"] == 3


def test_rating_must_be_between_1_and_5(client, customer_headers):
    dish_id = client.get("/api/dishes").json()[0]["id"]
    assert client.post(f"/api/dishes/{dish_id}/ratings", json={"stars": 9}, headers=customer_headers).status_code == 422


def test_favourites_toggle(client, customer_headers):
    dish_id = client.get("/api/dishes").json()[1]["id"]
    on = client.post(f"/api/favourites/{dish_id}", headers=customer_headers).json()
    off = client.post(f"/api/favourites/{dish_id}", headers=customer_headers).json()
    assert any(row["id"] == dish_id for row in on)
    assert all(row["id"] != dish_id for row in off)


# --------------------------------------------------------------------- orders


def test_order_is_priced_server_side(client, customer_headers):
    dishes = client.get("/api/dishes").json()
    first, second = dishes[0], dishes[1]
    response = client.post(
        "/api/orders",
        json={"items": [{"dish_id": first["id"], "quantity": 2}, {"dish_id": second["id"], "quantity": 1}], "table_number": "12"},
        headers=customer_headers,
    )
    assert response.status_code == 201
    order = response.json()
    assert order["total_rwf"] == first["price_rwf"] * 2 + second["price_rwf"]
    assert order["status"] == "pending"
    assert len(order["items"]) == 2


def test_order_with_unknown_dish_is_rejected(client, customer_headers):
    response = client.post("/api/orders", json={"items": [{"dish_id": 424242, "quantity": 1}]}, headers=customer_headers)
    assert response.status_code == 404


def test_customer_only_sees_their_own_orders(client, customer_headers):
    my_orders = client.get("/api/orders", headers=customer_headers).json()
    assert all(order["customer_name"] == "Aline Mukamana" for order in my_orders)


def test_order_status_flow_for_admin(client, admin_headers, customer_headers):
    dish_id = client.get("/api/dishes").json()[2]["id"]
    created = client.post("/api/orders", json={"items": [{"dish_id": dish_id, "quantity": 1}]}, headers=customer_headers).json()

    for status in ["accepted", "preparing", "ready", "completed"]:
        updated = client.patch(f"/api/admin/orders/{created['id']}", json={"status": status}, headers=admin_headers)
        assert updated.json()["status"] == status

    bad = client.patch(f"/api/admin/orders/{created['id']}", json={"status": "teleported"}, headers=admin_headers)
    assert bad.status_code == 422


def test_customer_cannot_set_order_status(client, customer_headers):
    order = client.get("/api/orders", headers=customer_headers).json()[0]
    assert client.patch(f"/api/admin/orders/{order['id']}", json={"status": "completed"}, headers=customer_headers).status_code == 403


def test_cancel_rules(client, customer_headers):
    dish_id = client.get("/api/dishes").json()[3]["id"]
    order = client.post("/api/orders", json={"items": [{"dish_id": dish_id, "quantity": 1}]}, headers=customer_headers).json()
    cancelled = client.post(f"/api/orders/{order['id']}/cancel", headers=customer_headers)
    assert cancelled.json()["status"] == "cancelled"
    again = client.post(f"/api/orders/{order['id']}/cancel", headers=customer_headers)
    assert again.status_code == 409


# ------------------------------------------------------------------ admin CRUD


def test_admin_can_create_update_and_retire_a_dish(client, admin_headers):
    category_id = client.get("/api/categories").json()[0]["id"]
    created = client.post(
        "/api/admin/dishes",
        json={"name": "Test Bowl", "description": "QA only", "category_id": category_id, "price_rwf": 5000, "is_vegan": True},
        headers=admin_headers,
    )
    assert created.status_code == 201
    dish_id = created.json()["id"]

    duplicate = client.post(
        "/api/admin/dishes",
        json={"name": "Test Bowl", "category_id": category_id, "price_rwf": 4000},
        headers=admin_headers,
    )
    assert duplicate.status_code == 409

    patched = client.patch(f"/api/admin/dishes/{dish_id}", json={"price_rwf": 6200}, headers=admin_headers)
    assert patched.json()["price_rwf"] == 6200

    unavailable = client.patch(f"/api/admin/dishes/{dish_id}", json={"is_available": False}, headers=admin_headers)
    assert unavailable.json()["is_available"] is False
    assert all(row["id"] != dish_id for row in client.get("/api/dishes").json())

    deleted = client.delete(f"/api/admin/dishes/{dish_id}", headers=admin_headers)
    assert deleted.json()["deleted"] is True


def test_dish_with_order_history_is_retired_not_deleted(client, admin_headers):
    """A dish that appears on past orders must be hidden, not destroyed.

    Naming a specific dish made this test depend on which dishes the seeder
    happened to give order history to. It now finds one that actually has an
    order, which is what the rule is about.
    """
    ordered_ids = {
        item["dish_id"]
        for order in client.get("/api/admin/orders", headers=admin_headers).json()
        for item in order["items"]
        if item["dish_id"] is not None
    }
    assert ordered_ids, "the seeder should create orders for this test to mean anything"
    dishes = client.get("/api/dishes").json()
    ordered = next(dish for dish in dishes if dish["id"] in ordered_ids)
    response = client.delete(f"/api/admin/dishes/{ordered['id']}", headers=admin_headers)
    assert response.json()["retired"] is True
    assert client.get(f"/api/dishes/{ordered['id']}").json()["is_available"] is False
    # put it back so later tests see the full menu
    client.patch(f"/api/admin/dishes/{ordered['id']}", json={"is_available": True}, headers=admin_headers)


def test_customer_cannot_modify_the_menu(client, customer_headers):
    category_id = client.get("/api/categories").json()[0]["id"]
    response = client.post(
        "/api/admin/dishes",
        json={"name": "Hacked", "category_id": category_id, "price_rwf": 1},
        headers=customer_headers,
    )
    assert response.status_code == 403


# ------------------------------------------------------------------- analytics


def test_analytics_reflects_data(client, admin_headers):
    body = client.get("/api/admin/analytics?days=7", headers=admin_headers).json()
    assert body["total_orders"] >= 9
    assert body["customers"] >= 7
    assert body["dishes"] >= 20
    assert len(body["last_7_days"]) == 7
    assert sum(day["orders"] for day in body["last_7_days"]) >= 9
    assert set(body["orders_by_status"]) == {"pending", "accepted", "preparing", "ready", "completed", "cancelled"}


def test_recommendation_logs_are_recorded(client, admin_headers):
    before = client.get("/api/admin/analytics", headers=admin_headers).json()["recommendations"]
    client.post("/api/recommend", json={"diet": "none", "occasion": "family"})
    after = client.get("/api/admin/analytics", headers=admin_headers).json()["recommendations"]
    assert after == before + 1


def test_choice_can_be_recorded_against_a_log(client):
    body = client.post("/api/recommend", json={"diet": "none"}).json()
    chosen = body["results"][0]["dish"]["id"]
    response = client.post(f"/api/recommend/{body['log_id']}/choose/{chosen}")
    assert response.status_code == 200
    assert response.json()["chosen_dish_id"] == chosen


# ---------------------------------------------------------------------------
# Natural-language search
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "query,expected_first",
    [
        ("espresso", "Espresso"),
        ("passion", "Passion"),
        ("mango", "Mango"),
        ("croissant", "Croissant"),
    ],
)
def test_search_returns_what_was_asked_for(client, query, expected_first):
    """A named thing must come back first.

    This is the bug that mattered: the search once answered "coffee" with beef,
    because the profile score outranked the literal word and the shortlist had
    already been truncated before the words were looked at.
    """
    response = client.post("/api/search", json={"query": query, "limit": 3})
    assert response.status_code == 200
    names = [row["dish"]["name"] for row in response.json()["results"]]
    assert names, f"no results for {query!r}"
    assert expected_first.lower() in names[0].lower(), f"{query!r} returned {names}"


@pytest.mark.parametrize(
    "query,expected_word",
    [
        ("coffee", "coffee"),
        ("tea", "tea"),
        ("juice", "juice"),
        ("breakfast", "breakfast"),
        ("dinner", "curry"),
        ("burger", "burger"),
        ("soup", "soup"),
        ("salad", "salad"),
        ("chicken", "chicken"),
        ("fish", "fish"),
        ("beef", "beef"),
        ("shake", "shake"),
        ("dessert", "cake"),
    ],
)
def test_a_single_food_word_returns_that_kind_of_dish(client, query, expected_word):
    """The everyday case: someone types one word and wants the obvious thing.

    "dinner" is the interesting one, because no dish is called dinner. It has
    to reach the plates a person would recognise as dinner rather than fall
    through to the taste profile.
    """
    response = client.post("/api/search", json={"query": query, "limit": 3})
    assert response.status_code == 200
    names = [row["dish"]["name"].lower() for row in response.json()["results"]]
    assert names, f"no results for {query!r}"
    assert any(expected_word in name for name in names), f"{query!r} returned {names}"


def test_search_honours_dietary_language(client):
    """"no meat" must not be read as a request for the grill."""
    response = client.post("/api/search", json={"query": "no meat", "limit": 6})
    assert response.status_code == 200
    body = response.json()
    assert body["understood"], "the parser should report what it understood"
    assert all(row["dish"]["is_vegetarian"] for row in body["results"])


def test_search_reports_what_it_understood(client):
    """The interface shows the parse back to the customer, so it has to exist."""
    body = client.post("/api/search", json={"query": "vegan date night"}).json()
    joined = " ".join(body["understood"])
    assert "vegan" in joined
    assert "date" in joined


def test_search_never_crashes_on_unrecognised_text(client):
    """Every value the parser can emit must exist in the ranker's vocabulary.

    An invented value used to raise KeyError and return 500.
    """
    for query in ["coffee", "zzz qqq", "expensive romantic", "quick"]:
        response = client.post("/api/search", json={"query": query})
        assert response.status_code == 200, f"{query!r} -> {response.status_code}"


# ---------------------------------------------------------------------------
# Roles and payment
# ---------------------------------------------------------------------------


def _make_kitchen(client, admin_headers) -> dict:
    """Register a customer, then have an administrator promote them to kitchen.

    The promotion step is the point. Public registration can only create
    customers, so staff accounts cannot be self-issued.
    """
    email = "kitchen.test@camelia.rw"
    client.post("/api/auth/register", json={"name": "Kitchen Test", "email": email,
                                            "password": "Kitchen123"})
    # Already exists on a second call, so look the account up either way rather
    # than assuming this is the first time. The previous version threw
    # StopIteration the moment the helper was used twice.
    people = client.get("/api/admin/customers", headers=admin_headers).json()
    user_id = next(u["id"] for u in people if u["email"] == email)
    promoted = client.patch(f"/api/admin/users/{user_id}/role", headers=admin_headers,
                            json={"role": "kitchen"})
    assert promoted.status_code == 200
    token = client.post("/api/auth/login", json={"email": email, "password": "Kitchen123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_registration_cannot_self_assign_a_role(client):
    """The security property, stated positively.

    A registration without a role field creates a customer, and a customer
    cannot reach the admin screens.
    """
    email = "sneaky@camelia.rw"
    created = client.post("/api/auth/register", json={"name": "Sneaky", "email": email,
                                                      "password": "Sneaky123"})
    assert created.status_code == 201
    assert created.json()["user"]["role"] == "customer"
    token = client.post("/api/auth/login", json={"email": email, "password": "Sneaky123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/admin/analytics", headers=headers).status_code == 403


def test_admin_cannot_demote_themselves(client, admin_headers):
    """Otherwise a single mistaken click locks everyone out of the dashboard."""
    me = client.get("/api/auth/me", headers=admin_headers).json()
    response = client.patch(f"/api/admin/users/{me['id']}/role", headers=admin_headers,
                            json={"role": "customer"})
    assert response.status_code == 409


def test_customer_cannot_promote_anyone(client):
    token = client.post("/api/auth/login", json=CUSTOMER).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/auth/me", headers=headers).json()
    response = client.patch(f"/api/admin/users/{me['id']}/role", headers=headers,
                            json={"role": "admin"})
    assert response.status_code == 403


@pytest.mark.parametrize(
    "email,password,role",
    [
        ("admin@camelia.rw", "Admin123", "admin"),
        ("customer@camelia.rw", "Customer123", "customer"),
        ("kitchen@camelia.rw", "Kitchen123", "kitchen"),
    ],
)
def test_each_demo_account_exists_and_has_its_own_role(client, email, password, role):
    """The three accounts are promised to whoever runs the demo.

    The kitchen account once disappeared when the seeding was rewritten, and
    nothing caught it because the role tests create their own user. Signing in
    as each seeded account is the only thing that would have noticed.
    """
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, f"{email} cannot sign in"
    token = response.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["role"] == role


def test_kitchen_can_see_orders(client, admin_headers):
    kitchen = _make_kitchen(client, admin_headers)
    assert client.get("/api/admin/orders", headers=kitchen).status_code == 200


def test_kitchen_cannot_manage_the_menu(client, admin_headers):
    """The important half of the role. A cook cannot change a price."""
    kitchen = _make_kitchen(client, admin_headers)
    response = client.post(
        "/api/admin/dishes",
        headers=kitchen,
        json={"name": "Should Not Exist", "category_id": 1, "price_rwf": 1000},
    )
    assert response.status_code == 403


def test_kitchen_cannot_see_analytics(client, admin_headers):
    """Revenue is not the kitchen's business."""
    kitchen = _make_kitchen(client, admin_headers)
    assert client.get("/api/admin/analytics", headers=kitchen).status_code == 403


def test_customer_cannot_see_orders(client):
    token = client.post("/api/auth/login", json=CUSTOMER).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/admin/orders", headers=headers).status_code == 403


def test_order_records_payment_method_and_starts_unpaid(client):
    token = client.post("/api/auth/login", json=CUSTOMER).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    dishes = client.get("/api/dishes").json()
    body = client.post(
        "/api/orders",
        headers=headers,
        json={"items": [{"dish_id": dishes[0]["id"], "quantity": 1}], "payment_method": "momo"},
    ).json()
    assert body["payment_method"] == "momo"
    # Nothing is ever charged. The order is recorded as unpaid until staff say otherwise.
    assert body["payment_status"] == "unpaid"


def test_admin_can_mark_payment_received(client, admin_headers):
    token = client.post("/api/auth/login", json=CUSTOMER).json()["access_token"]
    dishes = client.get("/api/dishes").json()
    order = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {token}"},
        json={"items": [{"dish_id": dishes[0]["id"], "quantity": 1}], "payment_method": "cash"},
    ).json()
    response = client.patch(
        f"/api/admin/orders/{order['id']}/payment",
        headers=admin_headers,
        json={"payment_status": "paid"},
    )
    assert response.status_code == 200
    assert response.json()["payment_status"] == "paid"


def test_analytics_reports_recommendation_effectiveness(client, admin_headers):
    """The number that answers "how do you know the AI works?"."""
    body = client.get("/api/admin/analytics", headers=admin_headers).json()
    effectiveness = body["recommendation_effectiveness"]
    assert set(effectiveness) == {"quizzes", "shown", "chosen", "acceptance_rate"}
    assert 0 <= effectiveness["acceptance_rate"] <= 100


# ---------------------------------------------------------------------------
# Newsletter
# ---------------------------------------------------------------------------


def test_newsletter_stores_an_address_once(client):
    first = client.post("/api/newsletter", json={"email": "reader@example.rw"})
    assert first.status_code == 201

    again = client.post("/api/newsletter", json={"email": "READER@example.rw"})
    assert again.status_code == 201
    assert again.json()["message"] == first.json()["message"], (
        "the same answer must come back either way, so the endpoint cannot be "
        "used to check whether somebody is on the list"
    )


def test_newsletter_rejects_an_address_that_is_not_one(client):
    assert client.post("/api/newsletter", json={"email": "nope"}).status_code == 422
