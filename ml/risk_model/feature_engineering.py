"""
파생 피처 생성 + 피처 선택 (Backward + Forward) — 이진 분류
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from config import SEED, BASE_FEATS, UX_CANDIDATES


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["BMI_GenHlth"] = df["BMI"] * df["GenHlth"]
    df["Age_HighBP"]  = df["Age"] * df["HighBP"]
    df["BMI_obese"]   = (df["BMI"] >= 30).astype(int)
    return df


def eval_cv(df: pd.DataFrame, y: np.ndarray, features: list, make_fn, cv: int = 3) -> tuple:
    X   = df[features].values
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=SEED)
    aucs = []

    for tri, vai in skf.split(X, y):
        model = make_fn()
        model.fit(X[tri], y[tri])
        proba = model.predict_proba(X[vai])[:, 1]
        aucs.append(roc_auc_score(y[vai], proba))

    return np.mean(aucs), np.std(aucs)


def backward_selection(df, y, features, make_fn, steps=4):
    current = features.copy()
    print("\n  --- Backward ---")

    for step in range(steps):
        base_auc, _ = eval_cv(df, y, current, make_fn)
        best_remove = None
        best_auc    = 0

        for f in current:
            trial = [x for x in current if x != f]
            auc, _ = eval_cv(df, y, trial, make_fn)
            if auc > best_auc:
                best_auc    = auc
                best_remove = f

        if best_auc >= base_auc - 0.0002:
            current.remove(best_remove)
            print(f"  Step {step+1}: -{best_remove:25s} → {len(current)}f, AUC={best_auc:.4f}")
        else:
            print(f"  Step {step+1}: 중단")
            break

    return current


def forward_selection(df, y, current, make_fn, steps=4):
    print("\n  --- Forward ---")

    for step in range(steps):
        candidates = [f for f in UX_CANDIDATES if f not in current]
        if not candidates:
            break

        base_auc, _ = eval_cv(df, y, current, make_fn)
        best_add  = None
        best_auc  = 0

        for f in candidates:
            trial = current + [f]
            auc, _ = eval_cv(df, y, trial, make_fn)
            if auc > best_auc:
                best_auc = auc
                best_add = f

        if best_auc > base_auc + 0.0002:
            current.append(best_add)
            print(f"  Step {step+1}: +{best_add:25s} → {len(current)}f, AUC={best_auc:.4f}")
        else:
            print(f"  Step {step+1}: 중단")
            break

    return current


def select_features(df, y, make_fn):
    base_auc, base_std = eval_cv(df, y, BASE_FEATS, make_fn)
    print(f"\n  시작: {len(BASE_FEATS)}f, AUC={base_auc:.4f} ± {base_std:.4f}")

    selected = backward_selection(df, y, BASE_FEATS, make_fn)
    final    = forward_selection(df, y, selected, make_fn)

    print(f"\n  최종 피처 {len(final)}개: {final}")
    return final