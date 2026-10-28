// API Schemas and Domain Types

export interface HealthResponse {
  status: string;
  version: string;
  dataset_loaded: boolean;
  models_available: string[];
}

export interface ColumnSummary {
  name: string;
  dtype: string;
  null_count: number;
  unique_count: number;
  sample_values: any[];
}

export interface SegmentChurnRate {
  segment: string;
  category: string;
  total_customers: number;
  churned_customers: number;
  churn_rate: number;
}

export interface NumericalStat {
  mean: number;
  median: number;
  std: number;
  q25: number;
  q75: number;
  min: number;
  max: number;
}

export interface DatasetSummary {
  source: string;
  total_rows: number;
  total_columns: number;
  columns: ColumnSummary[];
  churn_distribution: Record<string, number>;
  observed_churn_rate: number;
  segments: Record<string, SegmentChurnRate[]>;
  monthly_charges_stats: Record<string, NumericalStat>;
  tenure_stats: Record<string, NumericalStat>;
  has_target: boolean;
}

export interface CustomerRecord {
  customerID: string;
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
  Churn: string;
  predicted_probability?: number | null;
  predicted_churn?: string | null;
  risk_tier?: string | null;
}

export interface CustomerListResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  customers: CustomerRecord[];
}

export interface TrainRequest {
  model_type: 'logistic_regression' | 'svm';
  test_size: number;
  random_state: number;
  C: number;
  class_weight?: string | null;
  kernel?: 'rbf' | 'linear';
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  total: number;
}

export interface ROCPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface PRPoint {
  recall: number;
  precision: number;
  threshold: number;
}

export interface EvaluationMetrics {
  model_type: string;
  model_name: string;
  hyperparameters: Record<string, any>;
  train_size: number;
  test_size: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  specificity: number;
  log_loss?: number | null;
  brier_score?: number | null;
  confusion_matrix: ConfusionMatrixData;
  roc_curve: ROCPoint[];
  pr_curve: PRPoint[];
  trained_at: string;
  random_state: number;
}

export interface ThresholdSimulateResponse {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  specificity: number;
  confusion_matrix: ConfusionMatrixData;
}

export interface CustomerPredictInput {
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
  model_type?: string;
}

export interface FeatureContribution {
  feature: string;
  value: any;
  coefficient: number;
  contribution: number;
  impact_direction: 'increases_churn' | 'reduces_churn';
}

export interface SingleModelPrediction {
  model_type: string;
  model_name: string;
  probability: number;
  decision_score?: number | null;
  predicted_class: string;
  risk_level: 'Low' | 'Medium' | 'High';
  feature_contributions?: FeatureContribution[] | null;
}

export interface PredictionResponse {
  primary_prediction: SingleModelPrediction;
  comparison_prediction?: SingleModelPrediction | null;
  confidence_interval: [number, number];
  plain_language_explanation: string;
  retention_recommendations: string[];
}

export interface TwoProportionZTestResult {
  feature_name: string;
  group1_name: string;
  group1_total: number;
  group1_churned: number;
  group1_rate: number;
  group2_name: string;
  group2_total: number;
  group2_churned: number;
  group2_rate: number;
  difference_in_proportions: number;
  ci_lower: number;
  ci_upper: number;
  z_statistic: number;
  p_value: number;
  significance_level: number;
  is_statistically_significant: boolean;
  assumptions_met: boolean;
  research_question: string;
  null_hypothesis: string;
  alt_hypothesis: string;
  plain_language_interpretation: string;
}

export interface ChiSquareCell {
  category: string;
  churn_no_observed: number;
  churn_no_expected: number;
  churn_yes_observed: number;
  churn_yes_expected: number;
  total: number;
  churn_rate: number;
}

export interface ChiSquareTestResult {
  feature_name: string;
  chi2_statistic: number;
  p_value: number;
  degrees_of_freedom: number;
  contingency_table: ChiSquareCell[];
  cramers_v: number;
  effect_size_interpretation: string;
  is_statistically_significant: boolean;
  expected_cell_count_assumption_met: boolean;
  fishers_exact_p?: number | null;
  research_question: string;
  null_hypothesis: string;
  alt_hypothesis: string;
  plain_language_interpretation: string;
}

export interface OddsRatioItem {
  feature: string;
  raw_coefficient: number;
  odds_ratio: number;
  ci_lower: number;
  ci_upper: number;
  p_value: number;
  direction: string;
  plain_meaning: string;
}

export interface OddsRatiosResponse {
  intercept: number;
  baseline_odds: number;
  odds_ratios: OddsRatioItem[];
  model_r2_or_pseudo_r2: number;
  aic_or_log_loss: number;
  sigmoid_formula: string;
  plain_summary: string;
}

export interface SlideMetric {
  label: string;
  value: string;
}

export interface PresentationSlide {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  key_metrics: SlideMetric[];
}

export interface PresentationData {
  title: string;
  total_slides: number;
  slides: PresentationSlide[];
}
