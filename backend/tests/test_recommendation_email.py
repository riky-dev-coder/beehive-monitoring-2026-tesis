import pytest

from app.services.recommendation_email import send_latest_recommendation_email


class DummyResponse:
    def __init__(self, payload=None, status_code=200):
        self._payload = payload or {}
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception("error")

    @property
    def json(self):
        return self._payload


class DummyClient:
    def __init__(self, *args, **kwargs):
        self.sent = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, headers=None, json=None):
        self.sent = {"url": url, "headers": headers, "json": json}
        return DummyResponse({"id": "email_123"})


@pytest.mark.asyncio
async def test_send_latest_recommendation_email_uses_latest_recommendation(monkeypatch):
    class DummyTable:
        def select(self, *args, **kwargs):
            return self

        def order(self, *args, **kwargs):
            return self

        def limit(self, *args, **kwargs):
            return self

        def execute(self):
            return type("Resp", (), {"data": [{"titulo": "Revisión de la colmena", "recomendacion": "Verifica la entrada"}]})()

    class DummySupabase:
        def table(self, *args, **kwargs):
            return DummyTable()

    monkeypatch.setattr("app.services.recommendation_email.get_supabase_client", lambda: DummySupabase())
    monkeypatch.setattr("app.services.recommendation_email.httpx.AsyncClient", DummyClient)
    monkeypatch.setattr("app.services.recommendation_email.settings.resend_api_key", "test_key")
    monkeypatch.setattr("app.services.recommendation_email.settings.resend_to_email", "mizdezu@gmail.com")

    sent = await send_latest_recommendation_email()

    assert sent is True
