import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.data_manager import DataManager

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dataset_loaded"] is True
    assert "version" in data

def test_dataset_summary():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 7043
    assert data["total_columns"] == 21
    assert data["has_target"] is True
    assert 0.25 < data["observed_churn_rate"] < 0.28
    assert "Contract" in data["segments"]
    assert "InternetService" in data["segments"]
    assert "MonthlyCharges" in data["columns"][18]["name"] or any(c["name"] == "MonthlyCharges" for c in data["columns"])

def test_get_customers_pagination():
    response = client.get("/api/dataset/customers?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 7043
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["customers"]) == 10

def test_customer_filtering():
    response = client.get("/api/dataset/customers?contract=Two%20year&page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] > 1000
    for cust in data["customers"]:
        assert cust["Contract"] == "Two year"

def test_customer_by_id():
    # Pick first customer from list
    list_res = client.get("/api/dataset/customers?page=1&page_size=1")
    cid = list_res.json()["customers"][0]["customerID"]
    
    response = client.get(f"/api/dataset/customer/{cid}")
    assert response.status_code == 200
    data = response.json()
    assert data["customerID"] == cid
    assert "MonthlyCharges" in data
    assert "TotalCharges" in data

def test_customer_not_found():
    response = client.get("/api/dataset/customer/NON_EXISTENT_ID_9999")
    assert response.status_code == 404
