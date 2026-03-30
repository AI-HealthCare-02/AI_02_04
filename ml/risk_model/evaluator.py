"""
모델 평가 — 이진 분류
"""

import numpy as np
from sklearn.metrics import (
    roc_auc_score, f1_score, accuracy_score,
    recall_score, precision_score, classification_report,
)
from feature_engineering import eval_cv
from config import SEED


def evaluate(y_valid, proba, threshold: float) -> dict:
    pred     = (proba >= threshold).astype(int)
    auc      = roc_auc_score(y_valid, proba)
    accuracy = accuracy_score(y_valid, pred)
    f1       = f1_score(y_valid, pred)
    recall   = recall_score(y_valid, pred)
    precision = precision_score(y_valid, pred, zero_division=0)

    print(f"\n  AUC:       {auc:.4f}")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  F1:        {f1:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"\n{classification_report(y_valid, pred, target_names=['정상', '위험군'])}")

    return {
        "auc":       round(auc, 4),
        "accuracy":  round(accuracy, 4),
        "f1":        round(f1, 4),
        "recall":    round(recall, 4),
        "precision": round(precision, 4),
    }


def cross_validate(df, y, final_feats: list, make_fn) -> tuple:
    cv_auc, cv_std = eval_cv(df, y, final_feats, make_fn, cv=5)
    print(f"  5-Fold CV AUC: {cv_auc:.4f} ± {cv_std:.4f}")
    return cv_auc, cv_std