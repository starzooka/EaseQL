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
def dataset_database(tmp_path, monkeypatch):
    database_path = tmp_path / "validation.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)
    with duckdb.connect(str(database_path)) as connection:
        connection.execute('CREATE TABLE "customers" (customer_id INTEGER, name VARCHAR, city VARCHAR)')
        connection.execute(
            'CREATE TABLE "orders" '
            '(order_id INTEGER, customer_id INTEGER, product_id INTEGER, quantity INTEGER)'
        )
        connection.execute('CREATE TABLE "products" (product_id INTEGER, product_name VARCHAR)')
        connection.execute('CREATE TABLE "other_users_table" (secret VARCHAR)')
    return database_path


def test_valid_single_dataset_sql_passes_and_executes(dataset_database):
    datasets = [_dataset("customers")]

    result = sql_service.execute_read_only_query(
        'SELECT "name" FROM "customers" WHERE "city" = \'Kolkata\'',
        datasets=datasets,
    )

    assert result["columns"] == ["name"]
    assert result["row_count"] == 0


def test_valid_two_dataset_join_passes(dataset_database):
    sql = (
        'SELECT c."name", o."quantity" FROM "customers" AS c '
        'JOIN "orders" AS o ON c."customer_id" = o."customer_id"'
    )

    assert sql_service.validate_sql_for_datasets(sql, [_dataset("customers"), _dataset("orders")]) == sql


def test_valid_three_dataset_join_passes(dataset_database):
    sql = (
        'SELECT c."name", p."product_name" FROM "customers" AS c '
        'JOIN "orders" AS o ON c."customer_id" = o."customer_id" '
        'JOIN "products" AS p ON o."product_id" = p."product_id"'
    )

    assert sql_service.validate_sql_for_datasets(
        sql,
        [_dataset("customers"), _dataset("orders"), _dataset("products")],
    ) == sql


def test_irrelevant_available_dataset_does_not_need_to_be_referenced(dataset_database):
    sql = 'SELECT "name" FROM "customers"'

    assert sql_service.validate_sql_for_datasets(
        sql,
        [_dataset("customers"), _dataset("orders"), _dataset("products")],
    ) == sql


@pytest.mark.parametrize(
    "sql",
    [
        'SELECT * FROM "nonexistent_table"',
        'SELECT "missing" FROM "customers"',
        'SELECT c."customer_id" FROM "customers" AS c '
        'JOIN "orders" AS o ON c."missing_id" = o."customer_id"',
        'SELECT * FROM "customers" WHERE',
    ],
)
def test_invalid_sql_is_rejected_before_execution(dataset_database, sql):
    with pytest.raises(sql_service.SQLValidationError):
        sql_service.validate_sql_for_datasets(sql, [_dataset("customers"), _dataset("orders")])


def test_unauthorized_existing_table_is_rejected(dataset_database):
    with pytest.raises(sql_service.SQLValidationError, match="current user scope"):
        sql_service.validate_sql_for_datasets(
            'SELECT * FROM "other_users_table"',
            [_dataset("customers", user_id=1)],
        )
