import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_two_proportion_z_test():
    response = client.get("/api/statistics/hypothesis-test?test_type=two_proportion&feature_name=Contract&group1=Month-to-month&group2=Two%20year&alpha=0.05")
    assert response.status_code == 200
    data = response.json()
    assert data["test_type"] == "two_proportion"
    res = data["result"]
    assert res["feature_name"] == "Contract"
    assert res["group1_name"] == "Month-to-month"
    assert res["group2_name"] == "Two year"
    assert res["group1_rate"] > res["group2_rate"]
    assert res["z_statistic"] > 10.0  # Extremely strong difference
    assert res["p_value"] < 0.0001
    assert res["is_statistically_significant"] is True
    assert res["assumptions_met"] is True
    assert "reject the null hypothesis" in res["plain_language_interpretation"].lower()

def test_chi_square_test():
    response = client.get("/api/statistics/hypothesis-test?test_type=chi_square&feature_name=TechSupport&alpha=0.05")
    assert response.status_code == 200
    data = response.json()
    assert data["test_type"] == "chi_square"
    res = data["result"]
    assert res["feature_name"] == "TechSupport"
    assert res["chi2_statistic"] > 100.0
    assert res["p_value"] < 0.0001
    assert res["degrees_of_freedom"] == 2
    assert res["cramers_v"] > 0.15
    assert res["is_statistically_significant"] is True
    assert len(res["contingency_table"]) == 3

def test_odds_ratios_endpoint():
    response = client.get("/api/statistics/odds-ratios")
    assert response.status_code == 200
    data = response.json()
    assert "odds_ratios" in data
    assert len(data["odds_ratios"]) > 10
    
    # Check that contract month-to-month increases churn odds
    mtm_item = next((item for item in data["odds_ratios"] if "Month-to-month" in item["feature"]), None)
    if mtm_item:
        assert mtm_item["odds_ratio"] > 1.0
        assert mtm_item["ci_lower"] > 1.0

    # Check that 2-year contract reduces churn odds (OR < 1.0)
    two_yr_item = next((item for item in data["odds_ratios"] if "Two year" in item["feature"]), None)
    if two_yr_item:
        assert two_yr_item["odds_ratio"] < 1.0

def test_presentation_slides():
    response = client.get("/api/presentation/slides")
    assert response.status_code == 200
    data = response.json()
    assert data["total_slides"] == 9
    assert len(data["slides"]) == 9
    assert "Sigmoid" in data["slides"][3]["title"]
