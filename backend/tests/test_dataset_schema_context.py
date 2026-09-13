import duckdb

from app.models import Dataset
from app.services import sql_service


def test_schema_context_contains_all_datasets_for_one_user(tmp_path, monkeypatch):
    database_path = tmp_path / "datasets.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)

    with duckdb.connect(str(database_path)) as connection:
        connection.execute('CREATE TABLE "customers_table" (customer_id INTEGER, name VARCHAR)')
        connection.execute('INSERT INTO "customers_table" VALUES (1, \'Ada\')')
        connection.execute('CREATE TABLE "orders_table" (order_id INTEGER, customer_id INTEGER)')
        connection.execute('INSERT INTO "orders_table" VALUES (10, 1)')

    context = sql_service.get_schema_context_for_datasets(
        [
            Dataset(
                user_id=7,
                table_name="customers_table",
                original_filename="customers.csv",
                columns=[
                    {"name": "customer_id", "type": "INTEGER"},
                    {"name": "name", "type": "VARCHAR"},
                ],
            ),
            Dataset(
                user_id=7,
                table_name="orders_table",
                original_filename="orders.csv",
                columns=[
                    {"name": "order_id", "type": "INTEGER"},
                    {"name": "customer_id", "type": "INTEGER"},
                ],
            ),
        ]
    )

    assert context.index("DATASET: customers.csv") < context.index('TABLE: "customers_table"')
    assert context.index("DATASET: orders.csv") < context.index('TABLE: "orders_table"')
    assert '- "customer_id": INTEGER' in context
    assert context.count('- "customer_id": INTEGER') == 2
    assert "foreign key" not in context.lower()


def test_schema_context_does_not_include_datasets_from_other_users(tmp_path, monkeypatch):
    database_path = tmp_path / "datasets.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)

    with duckdb.connect(str(database_path)) as connection:
        connection.execute('CREATE TABLE "user_a_table" (id INTEGER)')

    user_a_datasets = [
        Dataset(
            user_id=1,
            table_name="user_a_table",
            original_filename="user-a.csv",
            columns=[{"name": "id", "type": "INTEGER"}],
        )
    ]
    other_user_dataset = Dataset(
        user_id=2,
        table_name="other_user_table",
        original_filename="other-user.csv",
        columns=[{"name": "secret", "type": "VARCHAR"}],
    )

    context = sql_service.get_schema_context_for_datasets(user_a_datasets)

    assert "user-a.csv" in context
    assert "other-user.csv" not in context
    assert "other_user_table" not in context
    assert other_user_dataset.original_filename not in context