from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Health & Status ---
class HealthResponse(BaseModel):
    status: str
    version: str
    dataset_loaded: bool
    models_available: List[str]

# --- Dataset Models ---
class ColumnSummary(BaseModel):
    name: str
    dtype: str
    null_count: int
    unique_count: int
    sample_values: List[Any]

class SegmentChurnRate(BaseModel):
    segment: str
    category: str
    total_customers: int
    churned_customers: int
    churn_rate: float

class DatasetSummary(BaseModel):
    source: str
    total_rows: int
    total_columns: int
    columns: List[ColumnSummary]
    churn_distribution: Dict[str, int]
    observed_churn_rate: float
    segments: Dict[str, List[SegmentChurnRate]]
    monthly_charges_stats: Dict[str, Dict[str, float]]
    tenure_stats: Dict[str, Dict[str, float]]
    has_target: bool

class DataValidationResult(BaseModel):
    valid: bool
    total_rows: int
    total_columns: int
    target_found: bool
    missing_required_features: List[str]
    errors: List[str]
    warnings: List[str]

class CustomerRecord(BaseModel):
    customerID: str
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float
    Churn: str
    predicted_probability: Optional[float] = None
    predicted_churn: Optional[str] = None
    risk_tier: Optional[str] = None

class CustomerListResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int
    customers: List[CustomerRecord]

# --- Training & Evaluation Models ---
class TrainRequest(BaseModel):
    model_type: str = Field(default="logistic_regression", description="'logistic_regression' or 'svm'")
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    random_state: int = Field(default=42)
    C: float = Field(default=1.0, gt=0.0)
    class_weight: Optional[str] = Field(default="balanced", description="'balanced' or None")
    kernel: Optional[str] = Field(default="rbf", description="'rbf' or 'linear' for SVM")

class ConfusionMatrixData(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int
    total: int

class ROCPoint(BaseModel):
    fpr: float
    tpr: float
    threshold: float

class PRPoint(BaseModel):
    recall: float
    precision: float
    threshold: float

class EvaluationMetrics(BaseModel):
    model_type: str
    model_name: str
    hyperparameters: Dict[str, Any]
    train_size: int
    test_size: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    specificity: float
    log_loss: Optional[float] = None
    brier_score: Optional[float] = None
    confusion_matrix: ConfusionMatrixData
    roc_curve: List[ROCPoint]
    pr_curve: List[PRPoint]
    trained_at: str
    random_state: int

class TrainResponse(BaseModel):
    success: bool
    message: str
    metrics: EvaluationMetrics

class ThresholdSimulateRequest(BaseModel):
    model_type: str
    threshold: float = Field(ge=0.01, le=0.99)

class ThresholdSimulateResponse(BaseModel):
    threshold: float
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    specificity: float
    confusion_matrix: ConfusionMatrixData

# --- Prediction Models ---
class CustomerPredictInput(BaseModel):
    gender: str = Field(default="Female")
    SeniorCitizen: int = Field(default=0, ge=0, le=1)
    Partner: str = Field(default="Yes")
    Dependents: str = Field(default="No")
    tenure: int = Field(default=12, ge=0, le=100)
    PhoneService: str = Field(default="Yes")
    MultipleLines: str = Field(default="No")
    InternetService: str = Field(default="Fiber optic")
    OnlineSecurity: str = Field(default="No")
    OnlineBackup: str = Field(default="No")
    DeviceProtection: str = Field(default="No")
    TechSupport: str = Field(default="No")
    StreamingTV: str = Field(default="Yes")
    StreamingMovies: str = Field(default="No")
    Contract: str = Field(default="Month-to-month")
    PaperlessBilling: str = Field(default="Yes")
    PaymentMethod: str = Field(default="Electronic check")
    MonthlyCharges: float = Field(default=75.5, ge=0.0)
    TotalCharges: float = Field(default=906.0, ge=0.0)
    model_type: Optional[str] = Field(default="logistic_regression")

class FeatureContribution(BaseModel):
    feature: str
    value: Any
    coefficient: float
    contribution: float
    impact_direction: str  # 'increases_churn' or 'reduces_churn'

class SingleModelPrediction(BaseModel):
    model_type: str
    model_name: str
    probability: float
    decision_score: Optional[float] = None
    predicted_class: str
    risk_level: str  # 'Low', 'Medium', 'High'
    feature_contributions: Optional[List[FeatureContribution]] = None

class PredictionResponse(BaseModel):
    primary_prediction: SingleModelPrediction
    comparison_prediction: Optional[SingleModelPrediction] = None
    confidence_interval: List[float]
    plain_language_explanation: str
    retention_recommendations: List[str]

# --- Statistical Engine Models ---
class TwoProportionZTestResult(BaseModel):
    feature_name: str
    group1_name: str
    group1_total: int
    group1_churned: int
    group1_rate: float
    group2_name: str
    group2_total: int
    group2_churned: int
    group2_rate: float
    difference_in_proportions: float
    ci_lower: float
    ci_upper: float
    z_statistic: float
    p_value: float
    significance_level: float
    is_statistically_significant: bool
    assumptions_met: bool
    research_question: str
    null_hypothesis: str
    alt_hypothesis: str
    plain_language_interpretation: str

class ChiSquareCell(BaseModel):
    category: str
    churn_no_observed: int
    churn_no_expected: float
    churn_yes_observed: int
    churn_yes_expected: float
    total: int
    churn_rate: float

class ChiSquareTestResult(BaseModel):
    feature_name: str
    chi2_statistic: float
    p_value: float
    degrees_of_freedom: int
    contingency_table: List[ChiSquareCell]
    cramers_v: float
    effect_size_interpretation: str
    is_statistically_significant: bool
    expected_cell_count_assumption_met: bool
    fishers_exact_p: Optional[float] = None
    research_question: str
    null_hypothesis: str
    alt_hypothesis: str
    plain_language_interpretation: str

class OddsRatioItem(BaseModel):
    feature: str
    raw_coefficient: float
    odds_ratio: float
    ci_lower: float
    ci_upper: float
    p_value: float
    direction: str  # 'Increases Churn Odds' or 'Protective / Retains'
    plain_meaning: str

class OddsRatiosResponse(BaseModel):
    intercept: float
    baseline_odds: float
    odds_ratios: List[OddsRatioItem]
    model_r2_or_pseudo_r2: float
    aic_or_log_loss: float
    sigmoid_formula: str
    plain_summary: str
