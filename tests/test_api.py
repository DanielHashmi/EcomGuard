"""Smoke tests for the public backend surface."""

from fastapi.testclient import TestClient

from backend.main import app
from backend.state import app_state


client = TestClient(app)


def setup_function() -> None:
    """Keep each test isolated from the module-level application state."""
    app_state.reset()


def test_health_reports_active_provider() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["provider"] in {"groq", "gemini"}


def test_review_can_be_ingested_and_listed() -> None:
    payload = {
        "text": "The USB-C connector gets hot during charging.",
        "rating": 1,
        "reviewer": "SmokeTest",
    }

    create_response = client.post("/api/reviews", json=payload)
    list_response = client.get("/api/reviews")

    assert create_response.status_code == 200
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1
    assert list_response.json()["reviews"][0]["reviewer"] == "SmokeTest"


def test_reset_returns_state_to_initial_snapshot() -> None:
    client.post(
        "/api/reviews",
        json={"text": "Test review", "rating": 3, "reviewer": "SmokeTest"},
    )

    response = client.post("/api/reset")
    snapshot = client.get("/api/state").json()

    assert response.status_code == 200
    assert response.json()["status"] == "reset_complete"
    assert snapshot["reviews_ingested"] == 0
    assert snapshot["proposed_actions"] == []
