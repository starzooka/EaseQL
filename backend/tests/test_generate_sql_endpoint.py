import asyncio
import re
from unittest.mock import patch

<<<<<<< HEAD
import duckdb
import pytest

from app.services import sql_service


TEST_CASES = [
    pytest.param("Show the first 5 rows", ["LIMIT 5"], id="limit-rows"),
    pytest.param(
        "What is the difference between the max and min Data_value?",
        ["MAX(Data_value)", "-", "MIN(Data_value)"],
        id="difference-between-extremes",
    ),
    pytest.param(
        "Show the total jobs by year.",
        ["SUM(Data_value)", "FLOOR(Period)", "GROUP BY"],
        id="total-jobs-by-year",
    ),
    pytest.param(
        "Find industries containing the word Manufacturing",
        ["LIKE '%Manufacturing%'"],
        id="industry-search",
    ),
]

GENERATED_SQL = {
    "Show the first 5 rows": "SELECT * FROM employment LIMIT 5;",
    "What is the difference between the max and min Data_value?": "SELECT MAX(Data_value) - MIN(Data_value) AS difference FROM employment;",
    "Show the total jobs by year.": "SELECT FLOOR(Period) AS year, SUM(Data_value) AS total_jobs FROM employment GROUP BY FLOOR(Period);",
    "Find industries containing the word Manufacturing": "SELECT * FROM employment WHERE Industry LIKE '%Manufacturing%';",
}
=======
from app.services import sql_service
>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b


class FakeResponse:
    def __init__(self, sql: str):
        self.sql = sql

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {"choices": [{"message": {"content": self.sql}}]}


<<<<<<< HEAD
class FakeAsyncClient:
    def __init__(self, timeout: int):
=======
class FakeClient:
    def __init__(self, timeout):
>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b
        assert timeout == 180

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return None

<<<<<<< HEAD
    async def post(self, url: str, json: dict) -> FakeResponse:
        question = json["messages"][1]["content"].split("QUESTION:\n", 1)[1]
        return FakeResponse(GENERATED_SQL[question])


@pytest.fixture
def employment_database_and_llm(tmp_path, monkeypatch):
    database_path = tmp_path / "employment.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)

    with duckdb.connect(str(database_path)) as connection:
        connection.execute(
            """
            CREATE TABLE employment AS SELECT * FROM (VALUES
                (2011.06, 'Manufacturing', 1200.0),
                (2012.06, 'Services', 1300.0)
            ) AS data(Period, Industry, Data_value)
            """
        )

    with patch("app.services.sql_service.httpx.AsyncClient", FakeAsyncClient):
        yield


@pytest.mark.parametrize("natural_language_query, expected_substrings", TEST_CASES)
def test_sql_generation(employment_database_and_llm, natural_language_query, expected_substrings):
    schema_text = sql_service.get_schema_context("employment")
    result = asyncio.run(sql_service.generate_sql(schema_text, natural_language_query))

    generated_sql = re.sub(r"\s+", "", result).casefold()
    for expected_substring in expected_substrings:
        normalized_expected = re.sub(r"\s+", "", expected_substring).casefold()
        assert normalized_expected in generated_sql, (
            f"Expected {expected_substring!r} in generated SQL {result!r}"
        )
=======
    async def post(self, url, json):
        assert url == sql_service.OLLAMA_CHAT_URL
        assert json["messages"][0]["role"] == "system"
        assert "safe, valid SQL" in json["messages"][0]["content"]
        assert "TABLE" in json["messages"][1]["content"]
        assert "largest amount" in json["messages"][1]["content"]
        return FakeResponse()


def test_generate_sql_cleans_ollama_response():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        result = asyncio.run(
            sql_service.generate_sql(
                schema_text='TABLE "uploaded_data" ("amount" DOUBLE);',
                question="Show the largest amount.",
            )
        )

    assert result == "SELECT COUNT(*) FROM uploaded_data;"
>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b
