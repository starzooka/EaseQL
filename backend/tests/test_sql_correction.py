import asyncio
from unittest.mock import AsyncMock

import duckdb
import pytest

from app.models import Dataset
from app.services import sql_service


def _dataset(table_name: str, user_id: int = 1) -> Dataset:
    return Dataset(
        user_id=user_id,
        table_name=table_name,
        original_filename=f"{table_name}.csv",
        columns=[],
    )


@pytest.fixture
def correction_database(tmp_path, monkeypatch):
    database_path = tmp_path / "correction.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)
    with duckdb.connect(str(database_path)) as connection:
        connection.execute('CREATE TABLE "customers" (customer_id INTEGER, name VARCHAR)')
        connection.execute('CREATE TABLE "orders" (customer_id INTEGER, quantity INTEGER)')
        connection.execute('CREATE TABLE "other_users_table" (secret VARCHAR)')
    return [_dataset("customers"), _dataset("orders")]


def test_valid_sql_does_not_call_correction(correction_database, monkeypatch):
    generate = AsyncMock(return_value='SELECT * FROM "customers"')
    correct = AsyncMock(side_effect=AssertionError("correction should not be called"))
    monkeypatch.setattr(sql_service, "generate_sql", generate)
    monkeypatch.setattr(sql_service, "correct_sql", correct)

    sql = asyncio.run(
        sql_service.generate_validated_sql(
            'TABLE "customers"',
            "show customers",
            correction_database,
        )
    )

    assert sql == 'SELECT * FROM "customers"'
    correct.assert_not_awaited()


def test_invalid_sql_is_corrected_once_and_executes(correction_database, monkeypatch):
    generate = AsyncMock(return_value='SELECT * FROM "missing_table"')
    correct = AsyncMock(return_value='SELECT * FROM "customers"')
    monkeypatch.setattr(sql_service, "generate_sql", generate)
    monkeypatch.setattr(sql_service, "correct_sql", correct)

    sql = asyncio.run(
        sql_service.generate_validated_sql(
            'TABLE "customers"',
            "show customers",
            correction_database,
        )
    )
    result = sql_service.execute_read_only_query(sql, correction_database)

    assert result["columns"] == ["customer_id", "name"]
    correct.assert_awaited_once_with(
        'TABLE "customers"',
        "show customers",
        'SELECT * FROM "missing_table"',
        "The query references an unavailable table or column, or has invalid SQL.",
    )


def test_invalid_correction_is_not_executed(correction_database, monkeypatch):
    generate = AsyncMock(return_value='SELECT * FROM "missing_table"')
    correct = AsyncMock(return_value='SELECT * FROM "still_missing"')
    execute = AsyncMock()
    monkeypatch.setattr(sql_service, "execute_read_only_query", execute)
    monkeypatch.setattr(sql_service, "generate_sql", generate)
    monkeypatch.setattr(sql_service, "correct_sql", correct)

    with pytest.raises(sql_service.SQLValidationError, match="corrected safely"):
        asyncio.run(
            sql_service.generate_validated_sql(
                'TABLE "customers"',
                "show customers",
                correction_database,
            )
        )

    correct.assert_awaited_once()
    execute.assert_not_awaited()


def test_correction_can_fix_unknown_table_and_join_column(correction_database, monkeypatch):
    generate = AsyncMock(
        return_value=(
            'SELECT c."name", o."quantity" FROM "customers" AS c '
            'JOIN "orders" AS o ON c."missing_id" = o."customer_id"'
        )
    )
    correct = AsyncMock(
        return_value=(
            'SELECT c."name", o."quantity" FROM "customers" AS c '
            'JOIN "orders" AS o ON c."customer_id" = o."customer_id"'
        )
    )
    monkeypatch.setattr(sql_service, "generate_sql", generate)
    monkeypatch.setattr(sql_service, "correct_sql", correct)

    sql = asyncio.run(
        sql_service.generate_validated_sql(
            'TABLE "customers"\nTABLE "orders"',
            "show customer order quantities",
            correction_database,
        )
    )
    result = sql_service.execute_read_only_query(sql, correction_database)

    assert result["columns"] == ["name", "quantity"]
    correct.assert_awaited_once()


def test_unauthorized_correction_is_rejected(correction_database, monkeypatch):
    generate = AsyncMock(return_value='SELECT * FROM "missing_table"')
    correct = AsyncMock(return_value='SELECT * FROM "other_users_table"')
    monkeypatch.setattr(sql_service, "generate_sql", generate)
    monkeypatch.setattr(sql_service, "correct_sql", correct)

    with pytest.raises(sql_service.SQLValidationError, match="corrected safely"):
        asyncio.run(
            sql_service.generate_validated_sql(
                'TABLE "customers"',
                "show customers",
                correction_database,
            )
        )

    correct.assert_awaited_once()


def test_left_join_correction_preserves_join_type(correction_database, monkeypatch):
    monkeypatch.setattr(sql_service, "generate_sql", AsyncMock(return_value='SELECT * FROM "missing_table"'))
    monkeypatch.setattr(
        sql_service,
        "correct_sql",
        AsyncMock(
            return_value=(
                'SELECT c."name", o."quantity" FROM "customers" AS c '
                'LEFT JOIN "orders" AS o ON c."customer_id" = o."customer_id"'
            )
        ),
    )

    sql = asyncio.run(
        sql_service.generate_validated_sql(
            'TABLE "customers"\nTABLE "orders"',
            "show all customers and any orders",
            correction_database,
        )
    )

    assert "LEFT JOIN" in sql