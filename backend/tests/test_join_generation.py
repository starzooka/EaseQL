import asyncio
import re
from unittest.mock import patch

from app.services import sql_service


SCHEMA = """
DATASET: customers.csv
TABLE: "user_customers"
COLUMNS:
- "customer_id": INTEGER
- "name": VARCHAR
- "city": VARCHAR

DATASET: orders.csv
TABLE: "user_orders"
COLUMNS:
- "order_id": INTEGER
- "customer_id": INTEGER
- "product_id": INTEGER
- "quantity": INTEGER

DATASET: products.csv
TABLE: "user_products"
COLUMNS:
- "product_id": INTEGER
- "product_name": VARCHAR
- "price": DOUBLE
"""


class FakeResponse:
    def __init__(self, sql: str):
        self.sql = sql

    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": self.sql}}]}


class FakeClient:
    prompts: list[str] = []

    def __init__(self, timeout):
        assert timeout == 180

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        pass

    async def post(self, url, json):
        prompt = json["messages"][1]["content"]
        self.prompts.append(prompt)
        question = prompt.split("QUESTION:\n", 1)[1].strip()
        if question == "Show customers from Kolkata":
            sql = 'SELECT * FROM "user_customers" WHERE "city" = \'Kolkata\''
        elif question == "Show customer names and order quantities":
            sql = (
                'SELECT c."name", o."quantity" FROM "user_customers" AS c '
                'JOIN "user_orders" AS o ON c."customer_id" = o."customer_id"'
            )
        elif question == "Show customer names and the products they ordered":
            sql = (
                'SELECT c."name", p."product_name" FROM "user_customers" AS c '
                'JOIN "user_orders" AS o ON c."customer_id" = o."customer_id" '
                'JOIN "user_products" AS p ON o."product_id" = p."product_id"'
            )
        elif question == "Show all customers, including customers who have not placed an order":
            sql = (
                'SELECT c."name" FROM "user_customers" AS c '
                'LEFT JOIN "user_orders" AS o ON c."customer_id" = o."customer_id"'
            )
        else:
            raise AssertionError(f"Unexpected question: {question}")
        return FakeResponse(sql)


def generate(question: str) -> str:
    return asyncio.run(
        sql_service.generate_sql(
            schema_text=SCHEMA,
            question=question,
        )
    )


def test_single_dataset_query_uses_only_relevant_table():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        sql = generate("Show customers from Kolkata")

    assert '"user_customers"' in sql
    assert '"user_orders"' not in sql
    assert '"user_products"' not in sql
    assert "JOIN" not in sql.upper()


def test_two_dataset_query_generates_join_from_shared_identifier():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        sql = generate("Show customer names and order quantities")

    assert '"user_customers"' in sql
    assert '"user_orders"' in sql
    assert re.search(r"JOIN", sql, re.IGNORECASE)
    assert re.search(r"customer_id.*customer_id", sql, re.IGNORECASE)


def test_three_dataset_query_generates_two_joins():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        sql = generate("Show customer names and the products they ordered")

    assert all(table in sql for table in ('"user_customers"', '"user_orders"', '"user_products"'))
    assert len(re.findall(r"\bJOIN\b", sql, re.IGNORECASE)) == 2


def test_irrelevant_dataset_is_excluded():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        sql = generate("Show customers from Kolkata")

    assert '"user_products"' not in sql


def test_left_join_request_preserves_left_join_semantics():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        sql = generate("Show all customers, including customers who have not placed an order")

    assert re.search(r"LEFT\s+JOIN", sql, re.IGNORECASE)


def test_generation_context_contains_only_supplied_user_datasets():
    FakeClient.prompts.clear()
    user_a_schema = '\n'.join(
        [
            'DATASET: customers.csv',
            'TABLE: "user_a_customers"',
            'COLUMNS:',
            '- "name": VARCHAR',
        ]
    )

    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        asyncio.run(
            sql_service.generate_sql(
                schema_text=user_a_schema,
                question="Show customer names and order quantities",
            )
        )

    prompt = FakeClient.prompts[-1]
    assert "user_a_customers" in prompt
    assert "user_b_orders" not in prompt