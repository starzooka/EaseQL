def test_upload_csv_returns_current_dataset_contract(authenticated_client):
    response = authenticated_client.post(
        "/api/upload",
        files={
            "file": (
                "data.csv",
                b"id,created_date,amount\n1,2026-01-02,12.5\n",
                "text/csv",
            )
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert set(payload) == {"dataset_id", "table", "row_count"}
    assert payload["dataset_id"] > 0
    assert payload["table"].startswith("user_")
    assert payload["row_count"] == 1
