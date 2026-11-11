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


def test_menu_is_seeded_with_six_categories_and_26_dishes(client):
    categories = client.get("/api/categories").json()
    dishes = client.get("/api/dishes").json()
    assert len(categories) == 6
    assert len(dishes) == 26
    assert {d["category_name"] for d in dishes} == {c["name"] for c in categories}


def test_dish_filters(client):
    vegan = client.get("/api/dishes?diet=vegan").json()
    assert vegan and all(d["is_vegan"] for d in vegan)

    cheap = client.get("/api/dishes?max_price=5000").json()
    assert cheap and all(d["price_rwf"] <= 5000 for d in cheap)

    found = client.get("/api/dishes?search=tilapia").json()
    assert any(d["name"] == "Grilled Tilapia" for d in found)


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
    payload = {"name": "Sneaky", "email": "sneaky@example.rw", "password": "secret123", "role": "admin"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "customer"


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
    quiz = {"diet": "halal", "spice": "mild", "budget": "low", "cuisine": "rwandan", "occasion": "casual"}
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
    dishes = client.get("/api/dishes").json()
    ordered = next(dish for dish in dishes if dish["name"] == "Katogo")
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
