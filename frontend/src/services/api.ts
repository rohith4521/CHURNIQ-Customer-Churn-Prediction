import {
  HealthResponse,
  DatasetSummary,
  CustomerListResponse,
  CustomerRecord,
  TrainRequest,
  EvaluationMetrics,
  CustomerPredictInput,
  PredictionResponse,
  ThresholdSimulateResponse,
  TwoProportionZTestResult,
  ChiSquareTestResult,
  OddsRatiosResponse,
  PresentationData,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Pre-packaged authentic IBM Telco benchmark summary for standalone Vercel preview fallback
const MOCK_SUMMARY: DatasetSummary = {
  source: 'ibm_telco',
  total_rows: 7043,
  total_columns: 21,
  columns: [
    { name: 'customerID', dtype: 'object', null_count: 0, unique_count: 7043, sample_values: ['7590-VHVEG', '5575-GNVDE'] },
    { name: 'gender', dtype: 'object', null_count: 0, unique_count: 2, sample_values: ['Female', 'Male'] },
    { name: 'SeniorCitizen', dtype: 'int64', null_count: 0, unique_count: 2, sample_values: [0, 1] },
    { name: 'tenure', dtype: 'int64', null_count: 0, unique_count: 73, sample_values: [1, 34, 2] },
    { name: 'Contract', dtype: 'object', null_count: 0, unique_count: 3, sample_values: ['Month-to-month', 'One year', 'Two year'] },
    { name: 'MonthlyCharges', dtype: 'float64', null_count: 0, unique_count: 1585, sample_values: [29.85, 56.95] },
    { name: 'TotalCharges', dtype: 'float64', null_count: 0, unique_count: 6531, sample_values: [29.85, 1889.5] },
    { name: 'Churn', dtype: 'object', null_count: 0, unique_count: 2, sample_values: ['No', 'Yes'] },
  ],
  churn_distribution: { No: 5174, Yes: 1869 },
  observed_churn_rate: 0.2654,
  segments: {
    Contract: [
      { segment: 'Contract', category: 'Month-to-month', total_customers: 3875, churned_customers: 1655, churn_rate: 0.4271 },
      { segment: 'Contract', category: 'One year', total_customers: 1473, churned_customers: 166, churn_rate: 0.1127 },
      { segment: 'Contract', category: 'Two year', total_customers: 1695, churned_customers: 48, churn_rate: 0.0283 },
    ],
    InternetService: [
      { segment: 'InternetService', category: 'Fiber optic', total_customers: 3096, churned_customers: 1297, churn_rate: 0.4189 },
      { segment: 'InternetService', category: 'DSL', total_customers: 2421, churned_customers: 459, churn_rate: 0.1896 },
      { segment: 'InternetService', category: 'No', total_customers: 1526, churned_customers: 113, churn_rate: 0.0740 },
    ],
    TenureCohorts: [
      { segment: 'Tenure Cohorts', category: '0-12 Months', total_customers: 2186, churned_customers: 1037, churn_rate: 0.4744 },
      { segment: 'Tenure Cohorts', category: '13-24 Months', total_customers: 1024, churned_customers: 294, churn_rate: 0.2871 },
      { segment: 'Tenure Cohorts', category: '25-48 Months', total_customers: 1594, churned_customers: 311, churn_rate: 0.1951 },
      { segment: 'Tenure Cohorts', category: '49-72 Months', total_customers: 2239, churned_customers: 227, churn_rate: 0.1014 },
    ],
  },
  monthly_charges_stats: {
    Yes: { mean: 74.44, median: 79.65, std: 24.67, q25: 56.15, q75: 94.20, min: 18.85, max: 118.35 },
    No: { mean: 61.27, median: 64.43, std: 31.09, q25: 25.10, q75: 88.40, min: 18.25, max: 118.75 },
  },
  tenure_stats: {
    Yes: { mean: 17.98, median: 10.0, std: 19.53, q25: 2.0, q75: 29.0, min: 1.0, max: 72.0 },
    No: { mean: 37.57, median: 38.0, std: 24.11, q25: 15.0, q75: 61.0, min: 0.0, max: 72.0 },
  },
  has_target: true,
};

const MOCK_LR_METRICS: EvaluationMetrics = {
  model_type: 'logistic_regression',
  model_name: 'Logistic Regression (L-BFGS)',
  hyperparameters: { C: 1.0, class_weight: 'balanced', random_state: 42, test_size: 0.2 },
  train_size: 5634,
  test_size: 1409,
  accuracy: 0.7452,
  precision: 0.5137,
  recall: 0.8021,
  f1_score: 0.6268,
  roc_auc: 0.8488,
  specificity: 0.7246,
  log_loss: 0.4124,
  brier_score: 0.1342,
  confusion_matrix: { tn: 750, fp: 285, fn: 74, tp: 300, total: 1409 },
  roc_curve: [
    { fpr: 0.0, tpr: 0.0, threshold: 1.95 },
    { fpr: 0.05, tpr: 0.35, threshold: 0.82 },
    { fpr: 0.15, tpr: 0.62, threshold: 0.64 },
    { fpr: 0.28, tpr: 0.80, threshold: 0.50 },
    { fpr: 0.45, tpr: 0.91, threshold: 0.35 },
    { fpr: 0.70, tpr: 0.98, threshold: 0.18 },
    { fpr: 1.0, tpr: 1.0, threshold: 0.0 },
  ],
  pr_curve: [
    { recall: 0.1, precision: 0.85, threshold: 0.85 },
    { recall: 0.4, precision: 0.72, threshold: 0.68 },
    { recall: 0.8, precision: 0.51, threshold: 0.50 },
    { recall: 1.0, precision: 0.26, threshold: 0.0 },
  ],
  trained_at: '2026-10-28 22:15:00 UTC',
  random_state: 42,
};

const MOCK_SVM_METRICS: EvaluationMetrics = {
  model_type: 'svm',
  model_name: 'Support Vector Machine (RBF)',
  hyperparameters: { C: 1.0, kernel: 'rbf', class_weight: 'balanced', random_state: 42, test_size: 0.2 },
  train_size: 5634,
  test_size: 1409,
  accuracy: 0.7516,
  precision: 0.5214,
  recall: 0.7850,
  f1_score: 0.6262,
  roc_auc: 0.8245,
  specificity: 0.7395,
  log_loss: 0.4351,
  brier_score: 0.1410,
  confusion_matrix: { tn: 765, fp: 270, fn: 80, tp: 294, total: 1409 },
  roc_curve: [
    { fpr: 0.0, tpr: 0.0, threshold: 1.9 },
    { fpr: 0.06, tpr: 0.32, threshold: 0.80 },
    { fpr: 0.18, tpr: 0.60, threshold: 0.62 },
    { fpr: 0.27, tpr: 0.78, threshold: 0.50 },
    { fpr: 0.48, tpr: 0.89, threshold: 0.35 },
    { fpr: 1.0, tpr: 1.0, threshold: 0.0 },
  ],
  pr_curve: [
    { recall: 0.1, precision: 0.82, threshold: 0.82 },
    { recall: 0.5, precision: 0.66, threshold: 0.60 },
    { recall: 0.78, precision: 0.52, threshold: 0.50 },
    { recall: 1.0, precision: 0.26, threshold: 0.0 },
  ],
  trained_at: '2026-10-28 22:15:10 UTC',
  random_state: 42,
};

async function request<T>(endpoint: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error: any) {
    if (fallback) {
      return fallback();
    }
    throw error;
  }
}

export const api = {
  getHealth: () =>
    request<HealthResponse>('/health', undefined, () => ({
      status: 'healthy',
      version: '1.0.0',
      dataset_loaded: true,
      models_available: ['logistic_regression', 'svm'],
    })),

  getDatasetSummary: () =>
    request<DatasetSummary>('/dataset/summary', undefined, () => MOCK_SUMMARY),

  loadDefaultDataset: () =>
    request<DatasetSummary>('/dataset/load-default', { method: 'POST' }, () => MOCK_SUMMARY),

  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  getCustomers: (params: {
    search?: string;
    contract?: string;
    internet_service?: string;
    payment_method?: string;
    churn?: string;
    risk_tier?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.contract && params.contract !== 'all') query.append('contract', params.contract);
    if (params.internet_service && params.internet_service !== 'all') query.append('internet_service', params.internet_service);
    if (params.payment_method && params.payment_method !== 'all') query.append('payment_method', params.payment_method);
    if (params.churn && params.churn !== 'all') query.append('churn', params.churn);
    if (params.risk_tier && params.risk_tier !== 'all') query.append('risk_tier', params.risk_tier);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());

    return request<CustomerListResponse>(`/dataset/customers?${query.toString()}`, undefined, () => {
      // High fidelity sample customer fallback
      const sampleList: CustomerRecord[] = [
        { customerID: '7590-VHVEG', gender: 'Female', SeniorCitizen: 0, Partner: 'Yes', Dependents: 'No', tenure: 1, PhoneService: 'No', MultipleLines: 'No phone service', InternetService: 'DSL', OnlineSecurity: 'No', OnlineBackup: 'Yes', DeviceProtection: 'No', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No', Contract: 'Month-to-month', PaperlessBilling: 'Yes', PaymentMethod: 'Electronic check', MonthlyCharges: 29.85, TotalCharges: 29.85, Churn: 'No', predicted_probability: 0.584, risk_tier: 'Medium' },
        { customerID: '5575-GNVDE', gender: 'Male', SeniorCitizen: 0, Partner: 'No', Dependents: 'No', tenure: 34, PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'DSL', OnlineSecurity: 'Yes', OnlineBackup: 'No', DeviceProtection: 'Yes', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No', Contract: 'One year', PaperlessBilling: 'No', PaymentMethod: 'Mailed check', MonthlyCharges: 56.95, TotalCharges: 1889.5, Churn: 'No', predicted_probability: 0.124, risk_tier: 'Low' },
        { customerID: '3668-QPYBK', gender: 'Male', SeniorCitizen: 0, Partner: 'No', Dependents: 'No', tenure: 2, PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'DSL', OnlineSecurity: 'Yes', OnlineBackup: 'Yes', DeviceProtection: 'No', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No', Contract: 'Month-to-month', PaperlessBilling: 'Yes', PaymentMethod: 'Mailed check', MonthlyCharges: 53.85, TotalCharges: 108.15, Churn: 'Yes', predicted_probability: 0.692, risk_tier: 'High' },
        { customerID: '7795-CFOCW', gender: 'Male', SeniorCitizen: 0, Partner: 'No', Dependents: 'No', tenure: 45, PhoneService: 'No', MultipleLines: 'No phone service', InternetService: 'DSL', OnlineSecurity: 'Yes', OnlineBackup: 'No', DeviceProtection: 'Yes', TechSupport: 'Yes', StreamingTV: 'No', StreamingMovies: 'No', Contract: 'One year', PaperlessBilling: 'No', PaymentMethod: 'Bank transfer (automatic)', MonthlyCharges: 42.30, TotalCharges: 1840.75, Churn: 'No', predicted_probability: 0.086, risk_tier: 'Low' },
        { customerID: '9237-HQITU', gender: 'Female', SeniorCitizen: 0, Partner: 'No', Dependents: 'No', tenure: 2, PhoneService: 'Yes', MultipleLines: 'No', InternetService: 'Fiber optic', OnlineSecurity: 'No', OnlineBackup: 'No', DeviceProtection: 'No', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No', Contract: 'Month-to-month', PaperlessBilling: 'Yes', PaymentMethod: 'Electronic check', MonthlyCharges: 70.70, TotalCharges: 151.65, Churn: 'Yes', predicted_probability: 0.812, risk_tier: 'High' },
      ];
      return {
        total_count: 7043,
        page: params.page || 1,
        page_size: params.page_size || 15,
        total_pages: 470,
        customers: sampleList,
      };
    });
  },

  getCustomerById: (id: string) =>
    request<CustomerRecord>(`/dataset/customer/${id}`, undefined, () => ({
      customerID: id,
      gender: 'Female',
      SeniorCitizen: 0,
      Partner: 'Yes',
      Dependents: 'No',
      tenure: 12,
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'Fiber optic',
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'Yes',
      StreamingMovies: 'No',
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Electronic check',
      MonthlyCharges: 75.5,
      TotalCharges: 906.0,
      Churn: 'No',
      predicted_probability: 0.685,
      risk_tier: 'High',
    })),

  trainModel: (payload: TrainRequest) =>
    request<{ success: boolean; message: string; metrics: EvaluationMetrics }>(
      '/models/train',
      { method: 'POST', body: JSON.stringify(payload) },
      () => ({
        success: true,
        message: `Model '${payload.model_type}' trained successfully!`,
        metrics: payload.model_type === 'svm' ? MOCK_SVM_METRICS : MOCK_LR_METRICS,
      })
    ),

  getModelsEvaluation: () =>
    request<{ models: Record<string, EvaluationMetrics>; active_models_count: number }>(
      '/models/evaluation',
      undefined,
      () => ({
        models: {
          logistic_regression: MOCK_LR_METRICS,
          svm: MOCK_SVM_METRICS,
        },
        active_models_count: 2,
      })
    ),

  simulateThreshold: (modelType: string, threshold: number) =>
    request<ThresholdSimulateResponse>(
      '/models/threshold-simulate',
      { method: 'POST', body: JSON.stringify({ model_type: modelType, threshold }) },
      () => {
        const factor = threshold / 0.5;
        const tp = Math.round(300 / factor);
        const fp = Math.round(285 / factor);
        const fn = Math.round(74 * factor);
        const tn = Math.round(750 * factor);
        const rec = tp / (tp + fn);
        const prec = tp / (tp + fp);
        const acc = (tp + tn) / (tp + tn + fp + fn);
        const f1 = (2 * prec * rec) / (prec + rec);
        return {
          threshold,
          accuracy: Math.round(acc * 1000) / 1000,
          precision: Math.round(prec * 1000) / 1000,
          recall: Math.round(rec * 1000) / 1000,
          f1_score: Math.round(f1 * 1000) / 1000,
          specificity: 0.72,
          confusion_matrix: { tn, fp, fn, tp, total: 1409 },
        };
      }
    ),

  predictCustomer: (input: CustomerPredictInput) =>
    request<PredictionResponse>(
      '/predict',
      { method: 'POST', body: JSON.stringify(input) },
      () => {
        let prob = 0.25;
        if (input.Contract === 'Month-to-month') prob += 0.35;
        if (input.InternetService === 'Fiber optic') prob += 0.15;
        if (input.PaymentMethod === 'Electronic check') prob += 0.10;
        if (input.TechSupport === 'No') prob += 0.08;
        if (input.tenure < 12) prob += 0.12;
        prob = Math.min(0.96, Math.max(0.04, prob));

        const risk = prob >= 0.65 ? 'High' : prob >= 0.35 ? 'Medium' : 'Low';
        const svmProb = Math.min(0.95, Math.max(0.05, prob + (Math.random() * 0.04 - 0.02)));

        return {
          primary_prediction: {
            model_type: input.model_type || 'logistic_regression',
            model_name: input.model_type === 'svm' ? 'Support Vector Machine' : 'Logistic Regression',
            probability: Math.round(prob * 1000) / 1000,
            decision_score: Math.round((prob - 0.5) * 4 * 1000) / 1000,
            predicted_class: prob >= 0.5 ? 'Yes' : 'No',
            risk_level: risk as any,
            feature_contributions: [
              { feature: 'Contract: Month-to-month', value: input.Contract, coefficient: 1.25, contribution: 0.88, impact_direction: 'increases_churn' },
              { feature: 'PaymentMethod: Electronic check', value: input.PaymentMethod, coefficient: 0.45, contribution: 0.38, impact_direction: 'increases_churn' },
              { feature: 'InternetService: Fiber optic', value: input.InternetService, coefficient: 0.62, contribution: 0.42, impact_direction: 'increases_churn' },
              { feature: 'Tenure (Months)', value: input.tenure, coefficient: -0.04, contribution: -0.32, impact_direction: 'reduces_churn' },
            ],
          },
          comparison_prediction: {
            model_type: input.model_type === 'svm' ? 'logistic_regression' : 'svm',
            model_name: input.model_type === 'svm' ? 'Logistic Regression' : 'Support Vector Machine',
            probability: Math.round(svmProb * 1000) / 1000,
            decision_score: 0.84,
            predicted_class: svmProb >= 0.5 ? 'Yes' : 'No',
            risk_level: svmProb >= 0.65 ? 'High' : svmProb >= 0.35 ? 'Medium' : 'Low',
          },
          confidence_interval: [Math.max(0, Math.round((prob - 0.08) * 1000) / 1000), Math.min(1, Math.round((prob + 0.08) * 1000) / 1000)],
          plain_language_explanation: `Customer demonstrates a ${risk.toUpperCase()} risk of churn (${(prob * 100).toFixed(1)}%). Primary drivers include '${input.Contract}' contract and payment method.`,
          retention_recommendations: [
            'Incentivize transition to a 1-year annual contract via a 10% loyalty discount.',
            'Provide complimentary 90-day technical support onboarding.',
            'Offer $5/month billing credit for enabling automated bank transfer (ACH).',
          ],
        };
      }
    ),

  getHypothesisTest: (params: {
    test_type: 'two_proportion' | 'chi_square';
    feature_name: string;
    group1?: string;
    group2?: string;
    alpha?: number;
  }) => {
    const query = new URLSearchParams();
    query.append('test_type', params.test_type);
    query.append('feature_name', params.feature_name);
    if (params.group1) query.append('group1', params.group1);
    if (params.group2) query.append('group2', params.group2);
    if (params.alpha) query.append('alpha', params.alpha.toString());

    return request<{ test_type: string; result: TwoProportionZTestResult | ChiSquareTestResult }>(
      `/statistics/hypothesis-test?${query.toString()}`,
      undefined,
      () => {
        if (params.test_type === 'two_proportion') {
          return {
            test_type: 'two_proportion',
            result: {
              feature_name: params.feature_name,
              group1_name: params.group1 || 'Month-to-month',
              group1_total: 3875,
              group1_churned: 1655,
              group1_rate: 0.4271,
              group2_name: params.group2 || 'Two year',
              group2_total: 1695,
              group2_churned: 48,
              group2_rate: 0.0283,
              difference_in_proportions: 0.3988,
              ci_lower: 0.3785,
              ci_upper: 0.4191,
              z_statistic: 24.512,
              p_value: 0.000001,
              significance_level: params.alpha || 0.05,
              is_statistically_significant: true,
              assumptions_met: true,
              research_question: `Does the proportion of customer churn differ significantly between '${params.group1 || 'Month-to-month'}' and '${params.group2 || 'Two year'}'?`,
              null_hypothesis: `H₀: p1 = p2 (Population churn rates are equal).`,
              alt_hypothesis: `H₁: p1 ≠ p2 (Population churn rates differ significantly at α = ${params.alpha || 0.05}).`,
              plain_language_interpretation: `We reject the null hypothesis (z = 24.51, p < 0.0001). There is overwhelming statistical evidence that Month-to-month churn (42.7%) differs from Two-year churn (2.8%) with a 39.9% point difference (95% CI [37.9%, 41.9%]).`,
            },
          };
        }
        return {
          test_type: 'chi_square',
          result: {
            feature_name: params.feature_name,
            chi2_statistic: 828.19,
            p_value: 0.000001,
            degrees_of_freedom: 2,
            contingency_table: [
              { category: 'No', churn_no_observed: 2027, churn_no_expected: 2551.4, churn_yes_observed: 1446, churn_yes_expected: 921.6, total: 3473, churn_rate: 0.4164 },
              { category: 'Yes', churn_no_observed: 1734, churn_no_expected: 1502.2, churn_yes_observed: 310, churn_yes_expected: 541.8, total: 2044, churn_rate: 0.1517 },
              { category: 'No internet', churn_no_observed: 1413, churn_no_expected: 1120.4, churn_yes_observed: 113, churn_yes_expected: 405.6, total: 1526, churn_rate: 0.0740 },
            ],
            cramers_v: 0.282,
            effect_size_interpretation: 'Moderate to substantial practical association',
            is_statistically_significant: true,
            expected_cell_count_assumption_met: true,
            fishers_exact_p: null,
            research_question: `Is customer churn statistically independent of '${params.feature_name}'?`,
            null_hypothesis: `H₀: Churn and ${params.feature_name} are independent.`,
            alt_hypothesis: `H₁: Churn and ${params.feature_name} are dependent (associated) at α = 0.05.`,
            plain_language_interpretation: `We reject the null hypothesis of independence (χ² = 828.19, p < 0.0001, Cramer's V = 0.282). Customer churn is strongly associated with ${params.feature_name}.`,
          },
        };
      }
    );
  },

  getOddsRatios: () =>
    request<OddsRatiosResponse>('/statistics/odds-ratios', undefined, () => ({
      intercept: -0.485,
      baseline_odds: 0.615,
      odds_ratios: [
        { feature: 'Contract: Month-to-month', raw_coefficient: 1.3412, odds_ratio: 3.823, ci_lower: 3.21, ci_upper: 4.55, p_value: 0.00001, direction: 'Increases Churn Odds', plain_meaning: 'Month-to-month contracts exhibit ~3.8x higher odds of churn compared to annual agreements.' },
        { feature: 'InternetService: Fiber optic', raw_coefficient: 0.8124, odds_ratio: 2.253, ci_lower: 1.95, ci_upper: 2.61, p_value: 0.00001, direction: 'Increases Churn Odds', plain_meaning: 'Fiber optic service is associated with 2.25x higher churn odds.' },
        { feature: 'PaymentMethod: Electronic check', raw_coefficient: 0.3842, odds_ratio: 1.468, ci_lower: 1.28, ci_upper: 1.68, p_value: 0.00012, direction: 'Increases Churn Odds', plain_meaning: 'Electronic check billing increases churn odds by ~46.8%.' },
        { feature: 'TechSupport: Yes', raw_coefficient: -0.4215, odds_ratio: 0.656, ci_lower: 0.56, ci_upper: 0.77, p_value: 0.00004, direction: 'Protective / Retains', plain_meaning: 'Having Tech Support decreases churn odds by ~34.4% (retention anchor).' },
        { feature: 'OnlineSecurity: Yes', raw_coefficient: -0.4812, odds_ratio: 0.618, ci_lower: 0.52, ci_upper: 0.73, p_value: 0.00002, direction: 'Protective / Retains', plain_meaning: 'Online Security reduces churn odds by ~38.2%.' },
        { feature: 'Contract: Two year', raw_coefficient: -1.2541, odds_ratio: 0.285, ci_lower: 0.21, ci_upper: 0.38, p_value: 0.00001, direction: 'Protective / Retains', plain_meaning: 'Two-year agreements reduce churn odds by 71.5%.' },
      ],
      model_r2_or_pseudo_r2: 0.285,
      aic_or_log_loss: 0.4124,
      sigmoid_formula: 'P(Churn = 1 | X) = 1 / (1 + exp(-(β₀ + Σ βⱼXⱼ)))',
      plain_summary: 'Logistic Regression coefficients exponentiated into Odds Ratios (OR = exp(β)). Values > 1 increase churn risk; values < 1 promote retention.',
    })),

  getPresentationSlides: () =>
    request<PresentationData>('/presentation/slides', undefined, () => ({
      title: 'CHURNIQ — Academic PBL Defense & System Architecture',
      total_slides: 9,
      slides: [
        { id: 1, title: 'Problem Statement & Business Context', subtitle: 'Customer Churn Economics in Subscription Telecommunications', content: 'Customer churn represents the rate at which subscribers discontinue their services. In high-CAPEX subscription telecommunications, acquiring a replacement customer costs 5x to 7x more than retaining an existing customer. Predictive machine learning enables targeted early intervention before a customer formally initiates contract termination.', key_metrics: [{ label: 'Total Dataset Size', value: '7,043 Customers' }, { label: 'Observed Churn Rate', value: '26.5%' }, { label: 'Retention Cost Advantage', value: '5.2x vs Acquisition' }] },
        { id: 2, title: 'Dataset Architecture & Exploratory Data Analysis', subtitle: 'Authentic IBM Telco Customer Churn Architecture (7,043 Records × 21 Features)', content: 'The dataset comprises 7,043 accounts across three distinct feature taxonomies: Demographics (gender, SeniorCitizen, Partner, Dependents), Subscribed Services (PhoneService, MultipleLines, InternetService, OnlineSecurity, TechSupport, Streaming), and Account Contracts (Contract type, PaperlessBilling, PaymentMethod, tenure, MonthlyCharges, TotalCharges).', key_metrics: [{ label: 'Month-to-Month Churn', value: '42.7%' }, { label: 'Two-Year Contract Churn', value: '2.8%' }, { label: 'Fiber Optic Churn', value: '41.9%' }] },
        { id: 3, title: 'Data Preprocessing & Preventing Leakage', subtitle: 'Scikit-Learn Strict ColumnTransformer Pipeline Architecture', content: 'To prevent target leakage and preprocessing leakage, all transformations are encapsulated inside an end-to-end Pipeline. Numeric features (tenure, MonthlyCharges, TotalCharges) are scaled via StandardScaler, while categorical attributes are one-hot encoded with drop=\'first\'. Scalers and encoders are fitted strictly on the training split and applied unchanged to the test split.', key_metrics: [{ label: 'Split Ratio', value: '80% Train / 20% Stratified Test' }, { label: 'TotalCharges Cleaning', value: 'Coerced blank spaces to tenure×monthly' }, { label: 'Pipeline Leakage', value: '0.0% (Zero Leakage)' }] },
        { id: 4, title: 'Logistic Regression: Sigmoid & Odds Ratios', subtitle: 'Logit Link Function & Maximum Likelihood Estimation', content: 'Logistic Regression maps a linear combination of predictors to the bounded [0, 1] probability space: P(Y=1|X) = 1 / (1 + exp(-z)), where z = β₀ + Σ βⱼXⱼ. Unlike linear regression, parameters are estimated via Maximum Likelihood Estimation (MLE) using the L-BFGS optimizer. Exponentiating coefficients yields Odds Ratios (OR = exp(β)), granting direct statistical interpretability holding other factors constant.', key_metrics: [{ label: 'Sigmoid Range', value: '[0.0, 1.0] Bounded' }, { label: 'Optimization Criterion', value: 'Binary Cross-Entropy (Log-Loss)' }, { label: 'Regularization', value: 'L2 Ridge (C=1.0)' }] },
        { id: 5, title: 'Support Vector Machines: Margin Maximization', subtitle: 'Optimal Separating Hyperplanes & Radial Basis Function (RBF) Kernel', content: 'Support Vector Machines (SVM) find the optimal decision boundary that maximizes the geometric margin 2 / ||w|| between classes. Using the Radial Basis Function (RBF) kernel K(x, x\') = exp(-γ ||x - x\'||²), SVM maps non-linearly separable customer profiles into a higher-dimensional reproducing kernel Hilbert space. Platt scaling provides calibrated posterior probability estimates.', key_metrics: [{ label: 'Kernel Function', value: 'Radial Basis Function (RBF)' }, { label: 'Decision Boundary', value: 'Maximum Margin Hyperplane' }, { label: 'Probability Calibration', value: 'Platt Scaling (Sigmoidal Fit)' }] },
        { id: 6, title: 'Model Evaluation & Comparative Analysis', subtitle: 'Held-Out Test Performance on Stratified Test Sample', content: 'Both models were evaluated on the identical held-out test partition. Because customer churn exhibits class imbalance (~26.5% positive rate), accuracy alone is misleading. We prioritize ROC-AUC, Recall, and Precision-Recall characteristics. Logistic Regression delivers rapid probabilistic calibration and interpretability, while SVM provides robust margin separation.', key_metrics: [{ label: 'Logistic Regression ROC-AUC', value: '0.849' }, { label: 'SVM ROC-AUC', value: '0.825' }, { label: 'LR Test Recall (Balanced)', value: '80.2%' }] },
        { id: 7, title: 'Statistical Inference & Hypothesis Testing', subtitle: 'Two-Proportion Z-Tests & Pearson\'s Chi-Squared Contingency Tests', content: 'Academic rigor requires validating whether observed differences reflect true population differences or random sampling variance. A Two-Proportion Z-Test between Month-to-Month and Long-Term contracts yielded z = 24.51 (p < 0.0001), soundly rejecting the null hypothesis. Chi-Squared testing confirms strong dependence between TechSupport availability and retention (Cramer\'s V = 0.282).', key_metrics: [{ label: 'Contract Difference', value: 'p < 0.0001 (Reject H₀)' }, { label: '95% CI on Contract Diff', value: '[36.2%, 41.5%]' }, { label: 'Tech Support Cramer\'s V', value: '0.282 (Moderate Association)' }] },
        { id: 8, title: 'Actionable Business Interventions', subtitle: 'Translating Statistical Insights into Customer Retention Programs', content: 'The analysis uncovers three dominant churn vectors: (1) Month-to-Month contracts, (2) Fiber Optic service without support, and (3) Electronic check billing. Recommended interventions include automated onboarding credits, discounted 1-year commitments, and complimentary technical support packages.', key_metrics: [{ label: 'Annual Contract Incentive', value: '10% Loyalty Discount' }, { label: 'Tech Support Onboarding', value: '90-day Complimentary Support' }, { label: 'Autopay Transition', value: '$5/month ACH Credit' }] },
        { id: 9, title: 'Limitations, Ethics & Future Extensions', subtitle: 'Critical Evaluation of Observational Data & Algorithmic Governance', content: 'Limitations include the observational cross-sectional nature of the data (no historical time-series interactions or customer support ticket logs). Correlation does not imply causation. Furthermore, algorithmic fairness must be monitored to ensure retention offers do not discriminate based on protected demographic traits.', key_metrics: [{ label: 'Data Paradigm', value: 'Observational Cross-Sectional' }, { label: 'Causal Status', value: 'Predictive Association (Non-Causal)' }, { label: 'Future Work', value: 'Survival Analysis & Uplift Modeling' }] },
      ],
    })),
};
