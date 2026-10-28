import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_model_training_logistic_regression():
    payload = {
        "model_type": "logistic_regression",
        "test_size": 0.2,
        "random_state": 42,
        "C": 1.0,
        "class_weight": "balanced"
    }
    response = client.post("/api/models/train", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    metrics = data["metrics"]
    assert metrics["model_type"] == "logistic_regression"
    assert metrics["test_size"] == 1409  # 20% of 7043 is ~1409
    assert 0.70 < metrics["accuracy"] < 0.90
    assert metrics["roc_auc"] > 0.80
    assert metrics["recall"] > 0.70
    assert len(metrics["roc_curve"]) > 5
    assert len(metrics["pr_curve"]) > 5

def test_model_training_svm():
    payload = {
        "model_type": "svm",
        "test_size": 0.2,
        "random_state": 42,
        "C": 1.0,
        "kernel": "rbf",
        "class_weight": "balanced"
    }
    response = client.post("/api/models/train", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    metrics = data["metrics"]
    assert metrics["model_type"] == "svm"
    assert metrics["roc_auc"] > 0.75
    assert metrics["confusion_matrix"]["total"] == metrics["test_size"]

def test_predict_customer():
    cust_input = {
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 2,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "Yes",
        "StreamingMovies": "Yes",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 85.5,
        "TotalCharges": 171.0,
        "model_type": "logistic_regression"
    }
    response = client.post("/api/predict", json=cust_input)
    assert response.status_code == 200
    data = response.json()
    primary = data["primary_prediction"]
    assert 0.0 <= primary["probability"] <= 1.0
    assert primary["risk_level"] in ["Low", "Medium", "High"]
    assert len(data["confidence_interval"]) == 2
    assert data["confidence_interval"][0] <= primary["probability"] <= data["confidence_interval"][1]
    assert len(primary["feature_contributions"]) > 0
    assert len(data["retention_recommendations"]) > 0

def test_threshold_simulation():
    req = {
        "model_type": "logistic_regression",
        "threshold": 0.3
    }
    response = client.post("/api/models/threshold-simulate", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["threshold"] == 0.3
    assert 0.0 <= data["recall"] <= 1.0
    assert 0.0 <= data["precision"] <= 1.0
    # At lower threshold (0.3), recall should be higher than precision
    assert data["recall"] >= data["precision"]
