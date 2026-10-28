import os
import math
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import pandas as pd
import numpy as np

from .config import DEFAULT_DATASET_PATH, TARGET_COLUMN, NUMERIC_FEATURES, CATEGORICAL_FEATURES, ID_COLUMN
from .models import DatasetSummary, ColumnSummary, SegmentChurnRate, CustomerRecord, CustomerListResponse, DataValidationResult

class DataManager:
    _instance: Optional["DataManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "initialized", False):
            return
        self.df: Optional[pd.DataFrame] = None
        self.dataset_source: str = "none"
        self.dataset_path: Optional[Path] = None
        self.load_default_dataset()
        self.initialized = True

    def load_default_dataset(self) -> bool:
        if DEFAULT_DATASET_PATH.exists():
            df = pd.read_csv(DEFAULT_DATASET_PATH)
            self._process_and_set_df(df, source="ibm_telco", path=DEFAULT_DATASET_PATH)
            return True
        return False

    def load_custom_dataset(self, file_path: Path) -> Tuple[bool, DataValidationResult]:
        validation = self.validate_csv(file_path)
        if not validation.valid:
            return False, validation
        df = pd.read_csv(file_path)
        self._process_and_set_df(df, source=f"uploaded_{file_path.name}", path=file_path)
        return True, validation

    def validate_csv(self, file_path: Path) -> DataValidationResult:
        errors = []
        warnings = []
        try:
            df = pd.read_csv(file_path, nrows=50000)
        except Exception as e:
            return DataValidationResult(
                valid=False,
                total_rows=0,
                total_columns=0,
                target_found=False,
                missing_required_features=[],
                errors=[f"Failed to parse CSV file: {str(e)}"],
                warnings=[]
            )

        total_rows, total_cols = df.shape
        if total_rows < 50:
            errors.append(f"Dataset has only {total_rows} rows. Minimum 50 rows required for reliable modeling.")

        # Check for target column
        target_found = TARGET_COLUMN in df.columns
        if not target_found:
            # Check common synonyms
            synonyms = ["churn", "target", "Exited", "Churned"]
            matched = [c for c in df.columns if c.lower() in [s.lower() for s in synonyms]]
            if matched:
                warnings.append(f"Target column '{TARGET_COLUMN}' not found directly, but potential candidate '{matched[0]}' detected.")
            else:
                errors.append(f"Missing mandatory target column '{TARGET_COLUMN}'.")

        # Check numeric and categorical features
        missing_features = []
        for feat in NUMERIC_FEATURES + CATEGORICAL_FEATURES:
            if feat not in df.columns:
                missing_features.append(feat)

        if missing_features:
            warnings.append(f"Missing standard features: {', '.join(missing_features)}. Defaults will be imputed if available.")

        return DataValidationResult(
            valid=len(errors) == 0,
            total_rows=total_rows,
            total_columns=total_cols,
            target_found=target_found,
            missing_required_features=missing_features,
            errors=errors,
            warnings=warnings
        )

    def _process_and_set_df(self, raw_df: pd.DataFrame, source: str, path: Path):
        df = raw_df.copy()
        # Clean TotalCharges: convert empty strings/spaces to NaN, then fill with MonthlyCharges * tenure
        if "TotalCharges" in df.columns:
            df["TotalCharges"] = pd.to_numeric(df["TotalCharges"].astype(str).str.strip(), errors="coerce")
            # If TotalCharges is NaN, fill with tenure * MonthlyCharges if available, or 0.0
            if "tenure" in df.columns and "MonthlyCharges" in df.columns:
                df["TotalCharges"] = df["TotalCharges"].fillna(df["tenure"] * df["MonthlyCharges"])
            else:
                df["TotalCharges"] = df["TotalCharges"].fillna(0.0)

        # Ensure SeniorCitizen is int
        if "SeniorCitizen" in df.columns:
            df["SeniorCitizen"] = pd.to_numeric(df["SeniorCitizen"], errors="coerce").fillna(0).astype(int)

        # Ensure tenure is int
        if "tenure" in df.columns:
            df["tenure"] = pd.to_numeric(df["tenure"], errors="coerce").fillna(0).astype(int)

        # Ensure MonthlyCharges is float
        if "MonthlyCharges" in df.columns:
            df["MonthlyCharges"] = pd.to_numeric(df["MonthlyCharges"], errors="coerce").fillna(0.0).astype(float)

        self.df = df
        self.dataset_source = source
        self.dataset_path = path

    def get_summary(self) -> Optional[DatasetSummary]:
        if self.df is None:
            return None

        df = self.df
        total_rows, total_cols = df.shape
        has_target = TARGET_COLUMN in df.columns

        # Columns summary
        cols_summary = []
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            unique_count = int(df[col].nunique())
            sample_vals = [None if pd.isna(x) else (int(x) if isinstance(x, (np.integer, int)) else (float(x) if isinstance(x, (np.floating, float)) else str(x))) for x in df[col].dropna().unique()[:5]]
            cols_summary.append(ColumnSummary(
                name=col,
                dtype=str(df[col].dtype),
                null_count=null_count,
                unique_count=unique_count,
                sample_values=sample_vals
            ))

        # Churn distribution
        churn_dist = {}
        observed_churn_rate = 0.0
        if has_target:
            val_counts = df[TARGET_COLUMN].value_counts().to_dict()
            churn_dist = {str(k): int(v) for k, v in val_counts.items()}
            yes_count = churn_dist.get("Yes", churn_dist.get(1, churn_dist.get("1", 0)))
            observed_churn_rate = round(yes_count / total_rows, 4) if total_rows > 0 else 0.0

        # Segments breakdown
        segments: Dict[str, List[SegmentChurnRate]] = {}
        segment_keys = ["Contract", "InternetService", "PaymentMethod", "TechSupport", "SeniorCitizen"]
        for key in segment_keys:
            if key in df.columns and has_target:
                seg_list = []
                for cat, group in df.groupby(key):
                    cat_total = len(group)
                    cat_churned = int((group[TARGET_COLUMN].astype(str).str.lower() == "yes").sum())
                    rate = round(cat_churned / cat_total, 4) if cat_total > 0 else 0.0
                    display_cat = str(cat) if key != "SeniorCitizen" else ("Senior Citizen" if cat == 1 else "Non-Senior")
                    seg_list.append(SegmentChurnRate(
                        segment=key,
                        category=display_cat,
                        total_customers=cat_total,
                        churned_customers=cat_churned,
                        churn_rate=rate
                    ))
                segments[key] = sorted(seg_list, key=lambda x: x.churn_rate, reverse=True)

        # Tenure cohort breakdown
        if "tenure" in df.columns and has_target:
            cohort_bins = [0, 12, 24, 48, 72]
            cohort_labels = ["0-12 Months", "13-24 Months", "25-48 Months", "49-72 Months"]
            df_cohort = df.copy()
            df_cohort["tenure_cohort"] = pd.cut(df_cohort["tenure"], bins=[-1, 12, 24, 48, 72], labels=cohort_labels)
            cohort_list = []
            for cat, group in df_cohort.groupby("tenure_cohort", observed=False):
                cat_total = len(group)
                cat_churned = int((group[TARGET_COLUMN].astype(str).str.lower() == "yes").sum())
                rate = round(cat_churned / cat_total, 4) if cat_total > 0 else 0.0
                cohort_list.append(SegmentChurnRate(
                    segment="Tenure Cohorts",
                    category=str(cat),
                    total_customers=cat_total,
                    churned_customers=cat_churned,
                    churn_rate=rate
                ))
            segments["TenureCohorts"] = cohort_list

        # Monthly Charges stats by Churn
        mc_stats = {}
        if "MonthlyCharges" in df.columns and has_target:
            for churn_val in ["Yes", "No"]:
                subset = df[df[TARGET_COLUMN].astype(str).str.lower() == churn_val.lower()]["MonthlyCharges"]
                if len(subset) > 0:
                    mc_stats[churn_val] = {
                        "mean": round(float(subset.mean()), 2),
                        "median": round(float(subset.median()), 2),
                        "std": round(float(subset.std()), 2),
                        "q25": round(float(subset.quantile(0.25)), 2),
                        "q75": round(float(subset.quantile(0.75)), 2),
                        "min": round(float(subset.min()), 2),
                        "max": round(float(subset.max()), 2),
                    }

        # Tenure stats by Churn
        tenure_stats = {}
        if "tenure" in df.columns and has_target:
            for churn_val in ["Yes", "No"]:
                subset = df[df[TARGET_COLUMN].astype(str).str.lower() == churn_val.lower()]["tenure"]
                if len(subset) > 0:
                    tenure_stats[churn_val] = {
                        "mean": round(float(subset.mean()), 2),
                        "median": round(float(subset.median()), 2),
                        "std": round(float(subset.std()), 2),
                        "q25": round(float(subset.quantile(0.25)), 2),
                        "q75": round(float(subset.quantile(0.75)), 2),
                        "min": round(float(subset.min()), 2),
                        "max": round(float(subset.max()), 2),
                    }

        return DatasetSummary(
            source=self.dataset_source,
            total_rows=total_rows,
            total_columns=total_cols,
            columns=cols_summary,
            churn_distribution=churn_dist,
            observed_churn_rate=observed_churn_rate,
            segments=segments,
            monthly_charges_stats=mc_stats,
            tenure_stats=tenure_stats,
            has_target=has_target
        )

    def get_customers(
        self,
        search: Optional[str] = None,
        contract: Optional[str] = None,
        internet_service: Optional[str] = None,
        payment_method: Optional[str] = None,
        churn: Optional[str] = None,
        risk_tier: Optional[str] = None,
        sort_by: str = "customerID",
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 15,
        model_predictions: Optional[Dict[str, Tuple[float, str, str]]] = None
    ) -> CustomerListResponse:
        if self.df is None:
            return CustomerListResponse(total_count=0, page=page, page_size=page_size, total_pages=0, customers=[])

        df = self.df.copy()

        # Filters
        if search:
            search_str = search.strip().lower()
            df = df[df[ID_COLUMN].astype(str).str.lower().str.contains(search_str, na=False)]
        if contract and contract != "all":
            df = df[df["Contract"].astype(str).str.lower() == contract.lower()]
        if internet_service and internet_service != "all":
            df = df[df["InternetService"].astype(str).str.lower() == internet_service.lower()]
        if payment_method and payment_method != "all":
            df = df[df["PaymentMethod"].astype(str).str.lower() == payment_method.lower()]
        if churn and churn != "all":
            df = df[df[TARGET_COLUMN].astype(str).str.lower() == churn.lower()]

        # Attach predictions if available
        if model_predictions:
            prob_col = []
            pred_col = []
            tier_col = []
            for cid in df[ID_COLUMN]:
                pred = model_predictions.get(str(cid))
                if pred:
                    prob_col.append(pred[0])
                    pred_col.append(pred[1])
                    tier_col.append(pred[2])
                else:
                    prob_col.append(None)
                    pred_col.append(None)
                    tier_col.append(None)
            df["predicted_probability"] = prob_col
            df["predicted_churn"] = pred_col
            df["risk_tier"] = tier_col

            if risk_tier and risk_tier != "all":
                df = df[df["risk_tier"] == risk_tier]

        # Sorting
        ascending = (sort_order.lower() == "asc")
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=ascending)

        total_count = len(df)
        total_pages = max(1, math.ceil(total_count / page_size))
        page = max(1, min(page, total_pages))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        subset = df.iloc[start_idx:end_idx]

        records = []
        for _, row in subset.iterrows():
            cid = str(row.get("customerID", ""))
            pred_info = model_predictions.get(cid) if model_predictions else None
            prob = pred_info[0] if pred_info else (row.get("predicted_probability") if "predicted_probability" in row else None)
            pred_ch = pred_info[1] if pred_info else (row.get("predicted_churn") if "predicted_churn" in row else None)
            rt = pred_info[2] if pred_info else (row.get("risk_tier") if "risk_tier" in row else None)

            records.append(CustomerRecord(
                customerID=cid,
                gender=str(row.get("gender", "Female")),
                SeniorCitizen=int(row.get("SeniorCitizen", 0)),
                Partner=str(row.get("Partner", "No")),
                Dependents=str(row.get("Dependents", "No")),
                tenure=int(row.get("tenure", 0)),
                PhoneService=str(row.get("PhoneService", "Yes")),
                MultipleLines=str(row.get("MultipleLines", "No")),
                InternetService=str(row.get("InternetService", "DSL")),
                OnlineSecurity=str(row.get("OnlineSecurity", "No")),
                OnlineBackup=str(row.get("OnlineBackup", "No")),
                DeviceProtection=str(row.get("DeviceProtection", "No")),
                TechSupport=str(row.get("TechSupport", "No")),
                StreamingTV=str(row.get("StreamingTV", "No")),
                StreamingMovies=str(row.get("StreamingMovies", "No")),
                Contract=str(row.get("Contract", "Month-to-month")),
                PaperlessBilling=str(row.get("PaperlessBilling", "Yes")),
                PaymentMethod=str(row.get("PaymentMethod", "Electronic check")),
                MonthlyCharges=round(float(row.get("MonthlyCharges", 0.0)), 2),
                TotalCharges=round(float(row.get("TotalCharges", 0.0)), 2),
                Churn=str(row.get("Churn", "No")),
                predicted_probability=round(prob, 4) if prob is not None else None,
                predicted_churn=pred_ch,
                risk_tier=rt
            ))

        return CustomerListResponse(
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            customers=records
        )

    def get_customer_by_id(self, customer_id: str) -> Optional[CustomerRecord]:
        if self.df is None:
            return None
        match = self.df[self.df[ID_COLUMN].astype(str) == customer_id]
        if match.empty:
            return None
        row = match.iloc[0]
        return CustomerRecord(
            customerID=str(row.get("customerID", "")),
            gender=str(row.get("gender", "Female")),
            SeniorCitizen=int(row.get("SeniorCitizen", 0)),
            Partner=str(row.get("Partner", "No")),
            Dependents=str(row.get("Dependents", "No")),
            tenure=int(row.get("tenure", 0)),
            PhoneService=str(row.get("PhoneService", "Yes")),
            MultipleLines=str(row.get("MultipleLines", "No")),
            InternetService=str(row.get("InternetService", "DSL")),
            OnlineSecurity=str(row.get("OnlineSecurity", "No")),
            OnlineBackup=str(row.get("OnlineBackup", "No")),
            DeviceProtection=str(row.get("DeviceProtection", "No")),
            TechSupport=str(row.get("TechSupport", "No")),
            StreamingTV=str(row.get("StreamingTV", "No")),
            StreamingMovies=str(row.get("StreamingMovies", "No")),
            Contract=str(row.get("Contract", "Month-to-month")),
            PaperlessBilling=str(row.get("PaperlessBilling", "Yes")),
            PaymentMethod=str(row.get("PaymentMethod", "Electronic check")),
            MonthlyCharges=round(float(row.get("MonthlyCharges", 0.0)), 2),
            TotalCharges=round(float(row.get("TotalCharges", 0.0)), 2),
            Churn=str(row.get("Churn", "No"))
        )
