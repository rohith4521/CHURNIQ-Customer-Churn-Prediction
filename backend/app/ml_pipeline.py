import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    log_loss,
    brier_score_loss,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

from .config import (
    MODELS_DIR,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    ID_COLUMN,
)
from .models import (
    TrainRequest,
    EvaluationMetrics,
    ConfusionMatrixData,
    ROCPoint,
    PRPoint,
    CustomerPredictInput,
    SingleModelPrediction,
    PredictionResponse,
    FeatureContribution,
    ThresholdSimulateResponse,
)

class MLPipelineManager:
    _instance: Optional["MLPipelineManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLPipelineManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "initialized", False):
            return
        self.models: Dict[str, Pipeline] = {}
        self.metrics: Dict[str, EvaluationMetrics] = {}
        self.test_cache: Dict[str, Tuple[pd.DataFrame, np.ndarray, np.ndarray]] = {}
        self.initialized = True
        self.load_persisted_models()

    def _build_preprocessor(self) -> ColumnTransformer:
        numeric_transformer = Pipeline(steps=[
            ("scaler", StandardScaler())
        ])
        categorical_transformer = Pipeline(steps=[
            ("onehot", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False))
        ])
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, NUMERIC_FEATURES),
                ("cat", categorical_transformer, CATEGORICAL_FEATURES),
            ],
            remainder="drop"
        )
        return preprocessor

    def train_model(self, df: pd.DataFrame, request: TrainRequest) -> EvaluationMetrics:
        start_time = time.time()
        
        # Prepare data
        clean_df = df.dropna(subset=[TARGET_COLUMN]).copy()
        y = (clean_df[TARGET_COLUMN].astype(str).str.lower() == "yes").astype(int).values
        X = clean_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()

        # Stratified train/test split to prevent leakage
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=request.test_size,
            random_state=request.random_state,
            stratify=y
        )

        preprocessor = self._build_preprocessor()

        if request.model_type == "logistic_regression":
            classifier = LogisticRegression(
                C=request.C,
                class_weight=request.class_weight,
                penalty="l2",
                solver="lbfgs",
                max_iter=1000,
                random_state=request.random_state,
            )
            model_name = "Logistic Regression"
        elif request.model_type == "svm":
            classifier = SVC(
                C=request.C,
                kernel=request.kernel or "rbf",
                probability=True,  # Enables Platt scaling for genuine calibrated probabilities
                class_weight=request.class_weight,
                random_state=request.random_state,
            )
            model_name = f"Support Vector Machine ({request.kernel or 'rbf'}.upper())"
        else:
            raise ValueError(f"Unsupported model type: {request.model_type}")

        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier)
        ])

        # Fit exclusively on training data
        pipeline.fit(X_train, y_train)

        # Predict on held-out test data
        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        # Calculate unbiased test metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_prob))
        loss = float(log_loss(y_test, y_prob))
        brier = float(brier_score_loss(y_test, y_prob))

        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

        # Compute ROC Curve (subsampled to max 50 points for smooth charting)
        fpr, tpr, roc_thresh = roc_curve(y_test, y_prob)
        step = max(1, len(fpr) // 50)
        roc_points = [
            ROCPoint(fpr=round(float(f), 4), tpr=round(float(t), 4), threshold=round(float(th), 4))
            for f, t, th in zip(fpr[::step], tpr[::step], roc_thresh[::step])
        ]
        # Always include end point
        if roc_points[-1].fpr != 1.0:
            roc_points.append(ROCPoint(fpr=1.0, tpr=1.0, threshold=0.0))

        # Precision-Recall Curve
        p_vals, r_vals, pr_thresh = precision_recall_curve(y_test, y_prob)
        pr_step = max(1, len(p_vals) // 50)
        pr_points = [
            PRPoint(precision=round(float(p), 4), recall=round(float(r), 4), threshold=round(float(th), 4))
            for p, r, th in zip(p_vals[::pr_step], r_vals[::pr_step], np.append(pr_thresh[::pr_step], 1.0))
        ]

        metrics = EvaluationMetrics(
            model_type=request.model_type,
            model_name=model_name,
            hyperparameters={
                "C": request.C,
                "class_weight": request.class_weight,
                "random_state": request.random_state,
                "kernel": request.kernel if request.model_type == "svm" else None,
                "test_size": request.test_size,
            },
            train_size=len(X_train),
            test_size=len(X_test),
            accuracy=round(acc, 4),
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            roc_auc=round(auc, 4),
            specificity=round(specificity, 4),
            log_loss=round(loss, 4),
            brier_score=round(brier, 4),
            confusion_matrix=ConfusionMatrixData(
                tn=int(tn),
                fp=int(fp),
                fn=int(fn),
                tp=int(tp),
                total=int(len(y_test))
            ),
            roc_curve=roc_points,
            pr_curve=pr_points,
            trained_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            random_state=request.random_state
        )

        # Store in-memory and cache test set for threshold simulator
        self.models[request.model_type] = pipeline
        self.metrics[request.model_type] = metrics
        self.test_cache[request.model_type] = (X_test, y_test, y_prob)

        # Persist to disk safely
        self._persist_model(request.model_type, pipeline, metrics)

        return metrics

    def _persist_model(self, model_type: str, pipeline: Pipeline, metrics: EvaluationMetrics):
        model_file = MODELS_DIR / f"{model_type}_pipeline.joblib"
        metrics_file = MODELS_DIR / f"{model_type}_metrics.joblib"
        try:
            joblib.dump(pipeline, model_file)
            joblib.dump(metrics, metrics_file)
        except Exception as e:
            print(f"Warning: Failed to persist model {model_type}: {e}")

    def load_persisted_models(self):
        for m_type in ["logistic_regression", "svm"]:
            model_file = MODELS_DIR / f"{m_type}_pipeline.joblib"
            metrics_file = MODELS_DIR / f"{m_type}_metrics.joblib"
            if model_file.exists() and metrics_file.exists():
                try:
                    self.models[m_type] = joblib.load(model_file)
                    self.metrics[m_type] = joblib.load(metrics_file)
                except Exception as e:
                    print(f"Failed to load persisted {m_type}: {e}")

    def simulate_threshold(self, model_type: str, threshold: float) -> ThresholdSimulateResponse:
        if model_type not in self.test_cache:
            raise ValueError(f"No active test cache for {model_type}. Please train the model first.")
        _, y_test, y_prob = self.test_cache[model_type]
        
        y_pred = (y_prob >= threshold).astype(int)
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

        return ThresholdSimulateResponse(
            threshold=threshold,
            accuracy=round(acc, 4),
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            specificity=round(spec, 4),
            confusion_matrix=ConfusionMatrixData(
                tn=int(tn),
                fp=int(fp),
                fn=int(fn),
                tp=int(tp),
                total=int(len(y_test))
            )
        )

    def _get_feature_contributions(self, input_df: pd.DataFrame, pipeline: Pipeline) -> List[FeatureContribution]:
        classifier = pipeline.named_steps["classifier"]
        preprocessor = pipeline.named_steps["preprocessor"]

        if not hasattr(classifier, "coef_"):
            return []

        # Get transformed feature values
        X_trans = preprocessor.transform(input_df)
        cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
        encoded_cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES)
        feature_names = NUMERIC_FEATURES + list(encoded_cat_names)
        
        coefs = classifier.coef_[0]
        # X_trans is 2D shape (1, n_features)
        x_vals = X_trans[0]
        contributions = x_vals * coefs

        results = []
        for feat_name, coef, val, cont in zip(feature_names, coefs, x_vals, contributions):
            if abs(cont) > 0.05:  # meaningful contribution
                direction = "increases_churn" if cont > 0 else "reduces_churn"
                # Map to human readable original feature if possible
                orig_feat = feat_name.split("_")[0] if "_" in feat_name else feat_name
                results.append(FeatureContribution(
                    feature=feat_name,
                    value=round(float(val), 2),
                    coefficient=round(float(coef), 4),
                    contribution=round(float(cont), 4),
                    impact_direction=direction
                ))

        # Sort by absolute contribution descending
        results.sort(key=lambda x: abs(x.contribution), reverse=True)
        return results[:8]  # top 8 most influential drivers

    def predict_customer(self, input_data: CustomerPredictInput) -> PredictionResponse:
        primary_type = input_data.model_type or "logistic_regression"
        if primary_type not in self.models:
            raise ValueError(f"Model '{primary_type}' is not trained yet. Please train it first.")

        # Convert input to DataFrame
        row_dict = input_data.model_dump(exclude={"model_type"})
        input_df = pd.DataFrame([row_dict])

        # Primary prediction
        primary_pipe = self.models[primary_type]
        prob = float(primary_pipe.predict_proba(input_df)[0, 1])
        pred_class = "Yes" if prob >= 0.5 else "No"
        risk_level = "High" if prob >= 0.65 else ("Medium" if prob >= 0.35 else "Low")
        
        decision_score = None
        classifier = primary_pipe.named_steps["classifier"]
        if hasattr(classifier, "decision_function"):
            decision_score = round(float(primary_pipe.decision_function(input_df)[0]), 4)

        contributions = None
        if primary_type == "logistic_regression":
            contributions = self._get_feature_contributions(input_df, primary_pipe)

        model_display_name = "Logistic Regression" if primary_type == "logistic_regression" else "Support Vector Machine"
        primary_pred = SingleModelPrediction(
            model_type=primary_type,
            model_name=model_display_name,
            probability=round(prob, 4),
            decision_score=decision_score,
            predicted_class=pred_class,
            risk_level=risk_level,
            feature_contributions=contributions
        )

        # Comparison prediction if other model exists
        other_type = "svm" if primary_type == "logistic_regression" else "logistic_regression"
        comparison_pred = None
        if other_type in self.models:
            other_pipe = self.models[other_type]
            o_prob = float(other_pipe.predict_proba(input_df)[0, 1])
            o_class = "Yes" if o_prob >= 0.5 else "No"
            o_risk = "High" if o_prob >= 0.65 else ("Medium" if o_prob >= 0.35 else "Low")
            o_dec = None
            if hasattr(other_pipe.named_steps["classifier"], "decision_function"):
                o_dec = round(float(other_pipe.decision_function(input_df)[0]), 4)
            
            o_cont = None
            if other_type == "logistic_regression":
                o_cont = self._get_feature_contributions(input_df, other_pipe)

            comparison_pred = SingleModelPrediction(
                model_type=other_type,
                model_name="Support Vector Machine" if other_type == "svm" else "Logistic Regression",
                probability=round(o_prob, 4),
                decision_score=o_dec,
                predicted_class=o_class,
                risk_level=o_risk,
                feature_contributions=o_cont
            )

        # Wilson / Normal 95% Confidence Interval for estimated probability (p +/- 1.96 * sqrt(p(1-p)/n_eff))
        # Where n_eff is pseudo sample size 100
        margin = 1.96 * np.sqrt(max(0.001, prob * (1.0 - prob)) / 100.0)
        ci_lower = max(0.0, round(prob - margin, 4))
        ci_upper = min(1.0, round(prob + margin, 4))

        # Plain language explanation
        if prob >= 0.65:
            explanation = (
                f"Customer demonstrates a HIGH probability of churn ({round(prob * 100, 1)}%, 95% CI [{round(ci_lower*100, 1)}% - {round(ci_upper*100, 1)}%]). "
                f"The model identifies substantial churn indicators such as short tenure ({input_data.tenure} months), "
                f"a '{input_data.Contract}' contract, and payment via '{input_data.PaymentMethod}'."
            )
        elif prob >= 0.35:
            explanation = (
                f"Customer falls into the MODERATE risk tier ({round(prob * 100, 1)}%). "
                f"They have some retention factors (e.g. tenure or bundle services) balanced against risk factors."
            )
        else:
            explanation = (
                f"Customer exhibits a LOW probability of churn ({round(prob * 100, 1)}%). "
                f"High stability is driven by favorable attributes like tenure ({input_data.tenure} months) and contract duration."
            )

        # Actionable Retention Recommendations
        recs = []
        if input_data.Contract == "Month-to-month":
            recs.append("Incentivize transition to a 1-year or 2-year annual agreement via a 10% loyalty discount.")
        if input_data.TechSupport == "No":
            recs.append("Provide complimentary 3-month Premium Tech Support onboarding to resolve early technical friction.")
        if input_data.PaymentMethod == "Electronic check":
            recs.append("Offer a $5/month billing credit for enabling Automated Bank Transfer (ACH) or Auto-Card billing.")
        if input_data.OnlineSecurity == "No":
            recs.append("Offer bundle security suite (Online Security + Cloud Backup) to deepen product stickiness.")
        if input_data.tenure <= 6:
            recs.append("Assign proactive Customer Success check-in at Day 30 and Day 60 during the high-attrition onboarding phase.")
        if not recs:
            recs.append("Maintain standard VIP nurture communication; customer exhibits strong loyalty indicators.")

        return PredictionResponse(
            primary_prediction=primary_pred,
            comparison_prediction=comparison_pred,
            confidence_interval=[ci_lower, ci_upper],
            plain_language_explanation=explanation,
            retention_recommendations=recs
        )

    def get_all_customer_predictions(self, df: pd.DataFrame, model_type: str = "logistic_regression") -> Dict[str, Tuple[float, str, str]]:
        if model_type not in self.models:
            return {}
        pipeline = self.models[model_type]
        X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
        try:
            probs = pipeline.predict_proba(X)[:, 1]
            preds = {}
            for cid, p in zip(df[ID_COLUMN], probs):
                cl = "Yes" if p >= 0.5 else "No"
                tier = "High" if p >= 0.65 else ("Medium" if p >= 0.35 else "Low")
                preds[str(cid)] = (round(float(p), 4), cl, tier)
            return preds
        except Exception as e:
            print(f"Error computing batch predictions: {e}")
            return {}
