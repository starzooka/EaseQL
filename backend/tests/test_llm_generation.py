import asyncio
import re
from pathlib import Path

import duckdb
import pytest

import app.main as main


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
    "What is the difference between the max and min Data_value?": (
        "SELECT MAX(Data_value) - MIN(Data_value) AS difference FROM employment;"
    ),
    "Show the total jobs by year.": (
        "SELECT FLOOR(Period) AS year, SUM(Data_value) AS total_jobs "
        "FROM employment GROUP BY FLOOR(Period);"
    ),
    "Find industries containing the word Manufacturing": (
        "SELECT * FROM employment WHERE Industry LIKE '%Manufacturing%';"
    ),
}


class FakeResponse:
    def __init__(self, sql: str):
        self.sql = sql

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {"choices": [{"message": {"content": self.sql}}]}


class FakeAsyncClient:
    def __init__(self, timeout: int):
        assert timeout == 60

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return None

    async def post(self, url: str, json: dict) -> FakeResponse:
        question = json["messages"][1]["content"].split("QUESTION:\n", 1)[1]
        return FakeResponse(GENERATED_SQL[question])


@pytest.fixture(autouse=True)
def employment_database_and_llm(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    original_database_path = main.DATABASE_PATH
    database_path = tmp_path / "employment.duckdb"
    main.DATABASE_PATH = database_path

    with duckdb.connect(str(database_path)) as connection:
        connection.execute(
            """
            CREATE TABLE employment AS SELECT * FROM (VALUES
                (2011.06, 'Manufacturing', 1200.0),
                (2012.06, 'Services', 1300.0)
            ) AS data(Period, Industry, Data_value)
            """
        )

    monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)
    yield
    main.DATABASE_PATH = original_database_path


@pytest.mark.parametrize("natural_language_query, expected_substrings", TEST_CASES)
def test_sql_generation(natural_language_query, expected_substrings):
    schema_text = main.get_schema_context("employment")
    result = asyncio.run(
        main.generate_sql(
            main.SQLRequest(schema_text=schema_text, question=natural_language_query)
        )
    )

    generated_sql = re.sub(r"\s+", "", result["sql"]).casefold()
    for expected_substring in expected_substrings:
        normalized_expected = re.sub(r"\s+", "", expected_substring).casefold()
        assert normalized_expected in generated_sql, (
            f"Expected {expected_substring!r} in generated SQL {result['sql']!r}"
        )
