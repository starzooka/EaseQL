import asyncio

import app.main as main


class FakeResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": "Here you go:\n```sql\nSELECT COUNT(*) FROM uploaded_data;\n```"}}]}


class FakeClient:
    def __init__(self, timeout):
        assert timeout == 60

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        pass

    async def post(self, url, json):
        assert url == main.OLLAMA_CHAT_URL
        assert json["messages"][0]["role"] == "system"
        assert "TABLE" in json["messages"][1]["content"]
        assert "largest amount" in json["messages"][1]["content"]
        return FakeResponse()


original_client = main.httpx.AsyncClient
main.httpx.AsyncClient = FakeClient
try:
    result = asyncio.run(
        main.generate_sql(
            main.SQLRequest(
                schema_text='TABLE "uploaded_data" ("amount" DOUBLE);',
                question="Show the largest amount.",
            )
        )
    )
finally:
    main.httpx.AsyncClient = original_client

assert result["sql"] == "SELECT COUNT(*) FROM uploaded_data;"
print("Ollama SQL endpoint checks passed")
