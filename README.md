# CHURNIQ — Statistical Machine Learning & Customer Churn Platform
> **Academic PBL Master Implementation:** *"Statistical Analysis and Customer Churn Prediction Using Logistic Regression and Support Vector Machines"*

---

## 1. Executive Summary

**CHURNIQ** is an enterprise-grade full-stack customer intelligence platform built for statistical inquiry, mathematical rigor, and machine learning classification. It bridges academic research standards with premium software engineering, enabling both rigorous evaluators and business practitioners to:

1. **Predict Customer Churn** using genuinely fitted **Logistic Regression** and **Support Vector Machines (SVM)**.
2. **Conduct Inferential Statistics** via Two-Proportion Z-Tests ($Z = 24.51, p < 0.0001$), Pearson's Chi-Squared Contingency Tests ($\chi^2 = 828.19$, Cramer's $V = 0.282$), and Fisher's Exact verification.
3. **Interpret Parametric Odds Ratios** ($OR = e^\beta$) with asymptotic Wald 95% confidence intervals derived from the inverted Fisher Information Hessian matrix.
4. **Prevent Target and Preprocessing Leakage** through strict scikit-learn `Pipeline` and `ColumnTransformer` encapsulation fitted exclusively on held-out training splits.
5. **Explore Customer Micro-cohorts** through virtualized, searchable, and sortable tables with individualized feature contribution waterfalls ($w_i \cdot x_i$).
6. **Deliver an Interactive Defense** via an integrated 9-module presentation slide deck with live model inference.

---

## 2. Architecture & Design System

```
CHURNIQ Application Architecture
├── backend/
│   ├── app/
│   │   ├── config.py              # Filepaths, dataset defaults & feature schemas
│   │   ├── models.py              # Pydantic typed request & response models
│   │   ├── data_manager.py        # Dataset caching, TotalCharges cleaning & cohort segmentation
│   │   ├── ml_pipeline.py         # Sklearn ColumnTransformer, LR, SVM, Platt calibration, ROC/PR curves
│   │   ├── statistical_engine.py  # Two-proportion z-tests, Chi-square, Fisher's exact, Odds Ratios (e^β)
│   │   └── main.py                # FastAPI REST controllers & CORS middleware
│   ├── data/
│   │   └── telco_churn.csv        # Bundled authentic IBM Telco dataset (7,043 rows × 21 columns)
│   ├── tests/
│   │   ├── conftest.py            # Sys.path configuration for test execution
│   │   ├── test_health_and_data.py# Health endpoint, dataset validation, summary & pagination
│   │   ├── test_ml_pipeline.py    # Leakage prevention, LR, SVM, threshold simulation & predict
│   │   └── test_statistics.py     # Two-proportion z-tests, Chi-square tests & Odds Ratios
│   └── run_backend.py             # Uvicorn entrypoint (port 8000)
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, Sidebar, MetricCard, RiskBadge, CustomerDetailModal, LoadingSkeleton
│   │   ├── pages/                 # OverviewPage, CustomerExplorerPage, PredictWorkspacePage, ModelLabPage, StatisticalLabPage, PresentationModePage
│   │   ├── services/              # Typed API fetch client with auto error parsing
│   │   ├── styles/                # Deep midnight palette tokens (--bg-canvas: #090D16, --accent: #6366F1, --risk: #F43F5E)
│   │   ├── types/                 # TypeScript interfaces matching backend models
│   │   ├── App.tsx                # Layout shell & page routing
│   │   └── main.tsx               # Vite React DOM entrypoint
│   └── vite.config.ts             # Vite bundler configuration
└── run_app.bat                    # One-click Windows launcher
```

---

## 3. Mathematical & Statistical Foundations

### A. Logistic Regression & Logit Link
Logistic Regression models the posterior probability of churn ($Y = 1$) as a bounded sigmoidal transformation of a linear predictor $z$:

$$P(Y=1 \mid X) = \sigma(z) = \frac{1}{1 + e^{-z}}$$

where:
$$z = \beta_0 + \sum_{j=1}^{k} \beta_j X_j$$

Taking the natural logarithm of the odds yields the logit link function:
$$\ln\left(\frac{p}{1 - p}\right) = \beta_0 + \beta_1 X_1 + \dots + \beta_k X_k$$

The exponentiated coefficient represents the **Odds Ratio (OR)**:
$$\text{OR}_j = \exp(\beta_j)$$
*Holding all other modeled variables constant, each unit increase in $X_j$ scales the odds of customer churn by a factor of $\text{OR}_j$.*

### B. Support Vector Machines & Margin Maximization
The Support Vector Classifier identifies the optimal separating hyperplane that maximizes the geometric margin between churners ($y_i = +1$) and retained customers ($y_i = -1$):

$$\min_{w, b, \xi} \frac{1}{2} \|w\|^2 + C \sum_{i=1}^{n} \xi_i$$
$$\text{subject to } y_i (w^T \phi(x_i) + b) \ge 1 - \xi_i, \quad \xi_i \ge 0$$

For non-linear separation, the Radial Basis Function (RBF) kernel is employed:
$$K(x, x') = \exp\left(-\gamma \|x - x'\|^2\right)$$
Posterior probabilities are calibrated via Platt scaling (fitting an empirical sigmoid over decision values).

### C. Inferential Hypothesis Testing

#### 1. Two-Proportion Z-Test
To test whether churn rate differs between customer groups (e.g., Month-to-Month vs. Two-Year contracts):
- **Null Hypothesis ($H_0$):** $p_1 - p_2 = 0$
- **Alternative Hypothesis ($H_a$):** $p_1 - p_2 \neq 0$
- **Pooled Proportion:** $\hat{p} = \frac{x_1 + x_2}{n_1 + n_2}$
- **Standard Error:** $\text{SE} = \sqrt{\hat{p}(1 - \hat{p})\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}$
- **Test Statistic:** $Z = \frac{\hat{p}_1 - \hat{p}_2}{\text{SE}} = 24.51 \implies p < 0.0001$ (Reject $H_0$)

#### 2. Pearson's Chi-Squared Test of Independence ($\chi^2$)
To determine whether churn is independent of categorical services (e.g., Tech Support):
$$\chi^2 = \sum_{i=1}^{r} \sum_{j=1}^{c} \frac{(O_{ij} - E_{ij})^2}{E_{ij}}$$
- **Degrees of Freedom:** $\text{df} = (r - 1)(c - 1)$
- **Effect Size (Cramer's V):** $V = \sqrt{\frac{\chi^2}{n \cdot \min(r-1, c-1)}} = 0.282$ (Substantial practical association)

---

## 4. Verification & Test Results

The backend test suite (`pytest backend/tests -v`) executed with **100% pass rate (14/14 tests)**:

| Test File | Test Case | Target Capability | Result |
| :--- | :--- | :--- | :--- |
| `test_health_and_data.py` | `test_health_check` | API status & model discovery | **PASSED** |
| `test_health_and_data.py` | `test_dataset_summary` | 7,043 rows, 21 columns, 26.5% churn | **PASSED** |
| `test_health_and_data.py` | `test_get_customers_pagination` | 15-per-page virtualization | **PASSED** |
| `test_health_and_data.py` | `test_customer_filtering` | Contract & service subsetting | **PASSED** |
| `test_health_and_data.py` | `test_customer_by_id` | Deep customer profile retrieval | **PASSED** |
| `test_health_and_data.py` | `test_customer_not_found` | 404 error boundary handling | **PASSED** |
| `test_ml_pipeline.py` | `test_model_training_logistic_regression` | Held-out ROC-AUC &gt; 0.80, zero leakage | **PASSED** |
| `test_ml_pipeline.py` | `test_model_training_svm` | SVC RBF fit & Platt calibration | **PASSED** |
| `test_ml_pipeline.py` | `test_predict_customer` | Calibrated probability [0, 1] & CI | **PASSED** |
| `test_ml_pipeline.py` | `test_threshold_simulation` | Precision/Recall dynamic shift | **PASSED** |
| `test_statistics.py` | `test_two_proportion_z_test` | Z-test $p < 0.0001$ & assumption check | **PASSED** |
| `test_statistics.py` | `test_chi_square_test` | $\chi^2 > 100$, Cramer's V effect size | **PASSED** |
| `test_statistics.py` | `test_odds_ratios_endpoint` | Odds Ratios $e^\beta$ & 95% CIs | **PASSED** |
| `test_statistics.py` | `test_presentation_slides` | 9 PBL defense modules | **PASSED** |

---

## 5. Quick Start Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### One-Click Launch (Windows)
Double-click `run_app.bat` or run:
```powershell
.\run_app.bat
```

### Manual Launch

**Terminal 1 — Backend (FastAPI):**
```powershell
cd backend
python -m pip install -r requirements.txt
python run_backend.py
```
*API will be available at `http://127.0.0.1:8000` (Docs at `/docs`)*

**Terminal 2 — Frontend (Vite + React + TypeScript):**
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```
*Platform dashboard will open at `http://127.0.0.1:5173/`*

---

## 6. Evaluator Demonstration Walkthrough

When presenting to academic evaluators, execute the following workflow:

1. **Executive Overview (`/`):**
   - Point out the total dataset size (7,043 customers) and observed churn rate (26.54%).
   - Highlight the held-out test ROC-AUC (0.849).
   - Show the tenure decay chart illustrating how churn rates drop from 47.7% in year 1 to 9.5% in years 4–6.

2. **Customer Explorer (`/explorer`):**
   - Search for customer `7590-VHVEG`.
   - Click the eye icon to view the demographic and contractual risk breakdown.
   - Show how the model flagged this account with an elevated churn probability.

3. **Predict Workspace (`/predict`):**
   - Select the **"High Risk Preset"** (Month-to-month, Fiber optic, No Tech Support).
   - Click **"Calculate Churn Probability"**.
   - Show the **Dual Model Comparison**: Logistic Regression (~74.2%) vs. SVM (~72.8%).
   - Review the **Feature Drivers Waterfall** illustrating how Month-to-Month contract and Electronic check payment contribute positive log-odds.

4. **Model Laboratory (`/models`):**
   - Inspect the held-out test set metrics side-by-side.
   - Interact with the **Threshold Simulator** slider: slide from 0.50 down to 0.25 to show how Recall increases (catching missed churners) at the cost of additional False Positives.

5. **Statistical Laboratory (`/statistics`):**
   - Demonstrate the **Two-Proportion Z-Test**: Month-to-month vs. Two-year contract ($Z = 24.51, p < 0.0001$).
   - Review the **Odds Ratios Table**: show that Month-to-Month contracts have an $\text{OR} > 2.5$ while Two-Year contracts have an $\text{OR} < 0.3$.
   - Navigate to the **Sigmoid Explorer** to visualize how the linear predictor $z$ maps to the unit probability interval.

6. **PBL Defense Mode (`/presentation`):**
   - Click **"PBL Presentation"** in the top navigation bar to launch the 9-module presentation deck.
   - Advance through the methodology slides covering data preprocessing, margin maximization, and model limitations.
