"""
실행 진입점 — 이진 분류 (정상 vs 위험군)
python train.py

데이터: diabetes_binary_5050split_health_indicators_BRFSS2015.csv (50:50 균형)
타겟: 0=정상, 1=위험군
"""

import os
import joblib
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

from config import (
    SEED, SAVE_DIR, MODEL_FILE, FEATURE_FILE, THRESHOLD_FILE,
    BASE_FEATS, UX_CANDIDATES, THRESHOLD, LGB_DEFAULT_HP
)
from data_loader import load_data, get_labels
from feature_engineering import add_derived_features, select_features
from trainer import make_boost_model, search_hp, train_model, HAS_LGB
from evaluator import evaluate, cross_validate

np.random.seed(SEED)


def _make_base_model():
    """피처 선택용 기본 모델 생성"""
    if HAS_LGB:
        import lightgbm as lgb  # type: ignore
        return lgb.LGBMClassifier(
            n_estimators=500,
            max_depth=5,
            learning_rate=0.03,
            num_leaves=20,
            min_child_samples=50,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            class_weight="balanced",
            random_state=SEED,
            n_jobs=-1,
            verbose=-1,
        )
    else:
        from sklearn.ensemble import GradientBoostingClassifier
        return GradientBoostingClassifier(
            n_estimators=300, max_depth=5,
            learning_rate=0.05, subsample=0.8,
            random_state=SEED,
        )


def main():
    print("\n" + "=" * 60)
    print("  당뇨 위험도 예측 — 이진 분류 (정상 vs 위험군)")
    print("=" * 60)


    print(f"\n{'='*60}")
    print("  STEP 1: 데이터 로드")
    print("=" * 60)

    df = load_data()
    df = add_derived_features(df)
    y  = get_labels(df)

    print(f"\n{'='*60}")
    print("  STEP 2: Train/Valid Split")
    print("=" * 60)

    all_candidates = list(dict.fromkeys(BASE_FEATS + UX_CANDIDATES))
    all_candidates = [f for f in all_candidates if f in df.columns]

    X_all = df[all_candidates].values
    X_train, X_valid, y_train, y_valid = train_test_split(
        X_all, y, test_size=0.2, random_state=SEED, stratify=y
    )

    df_train = pd.DataFrame(X_train, columns=all_candidates)

    print(f"  Train: {X_train.shape}")
    print(f"  Valid: {X_valid.shape}")
    print(f"  Train 위험군 비율: {y_train.mean():.1%}")
    print(f"  Valid 위험군 비율: {y_valid.mean():.1%}")


    print(f"\n{'='*60}")
    print("  STEP 3: 피처 선택 (Backward + Forward)")
    print("=" * 60)

    final_feats = select_features(df_train, y_train, _make_base_model)


    print(f"\n{'='*60}")
    print("  STEP 4: HP 탐색")
    print("=" * 60)

    best_hp = search_hp(df_train, y_train, final_feats)

    print(f"\n{'='*60}")
    print("  STEP 5: 모델 학습")
    print("=" * 60)

    feat_idx = [all_candidates.index(f) for f in final_feats]
    X_tr = X_train[:, feat_idx]
    X_va = X_valid[:, feat_idx]

    model, valid_auc = train_model(X_tr, y_train, X_va, y_valid, best_hp)


    print(f"\n{'='*60}")
    print("  STEP 6: 평가")
    print("=" * 60)

    proba   = model.predict_proba(X_va)[:, 1]
    metrics = evaluate(y_valid, proba, THRESHOLD)

    def make_final():
        return make_boost_model(best_hp.copy())

    cv_auc, cv_std = cross_validate(df_train, y_train, final_feats, make_final)

  
    print(f"\n{'='*60}")
    print("  STEP 7: 모델 저장")
    print("=" * 60)

    os.makedirs(SAVE_DIR, exist_ok=True)
    joblib.dump(model,       os.path.join(SAVE_DIR, MODEL_FILE))
    joblib.dump(final_feats, os.path.join(SAVE_DIR, FEATURE_FILE))
    joblib.dump(THRESHOLD,   os.path.join(SAVE_DIR, THRESHOLD_FILE))

    print(f"  {MODEL_FILE}      ← 이진 분류 LightGBM")
    print(f"  {FEATURE_FILE} ← {len(final_feats)}개 피처")
    print(f"  {THRESHOLD_FILE}   ← threshold={THRESHOLD}")

    # Feature Importance
    print(f"\n  [Feature Importance]")
    imp_df = pd.DataFrame({
        "feature":    final_feats,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)

    max_imp = imp_df["importance"].max()
    for _, row in imp_df.iterrows():
        bar = "█" * int(row["importance"] / max_imp * 20)
        print(f"    {row['feature']:25s} {bar}")


    print(f"\n{'='*60}")
    print("  STEP 8: 샘플 예측 검증")
    print("=" * 60)

    from predictor import RiskPredictor
    predictor = RiskPredictor()

    test_cases = [
        ("건강한 30대 남성", {
            "HighBP": 0, "HighChol": 0, "BMI": 22,
            "HeartDiseaseorAttack": 0, "HvyAlcoholConsump": 0,
            "GenHlth": 1, "DiffWalk": 0, "Sex": 1, "Age": 5,
        }),
        ("고위험 60대 여성", {
            "HighBP": 1, "HighChol": 1, "BMI": 35,
            "HeartDiseaseorAttack": 1, "HvyAlcoholConsump": 0,
            "GenHlth": 4, "DiffWalk": 1, "Sex": 0, "Age": 10,
        }),
        ("경계선 50대 남성", {
            "HighBP": 1, "HighChol": 0, "BMI": 28,
            "HeartDiseaseorAttack": 0, "HvyAlcoholConsump": 0,
            "GenHlth": 3, "DiffWalk": 0, "Sex": 1, "Age": 8,
        }),
    ]

    for label, inp in test_cases:
        result = predictor.predict(inp)
        print(f"\n  [{label}]")
        print(f"    결과:      {result['class_label']}", end="")
        if result["risk_level"]:
            print(f" ({result['risk_level'].upper()})", end="")
        print()
        print(f"    위험 점수: {result['risk_score']:.4f}")
        print(f"    위험 요인: {result['top_risk_factors']}")
        print(f"    추천:      {result['recommendation']}")

    print(f"\n{'='*60}")
    print("  최종 결과")
    print("=" * 60)
    print(f"""
  피처:          {len(final_feats)}개
  AUC:           {metrics['auc']:.4f}
  F1 (위험군):   {metrics['f1']:.4f}
  Recall:        {metrics['recall']:.4f}
  5-Fold CV AUC: {cv_auc:.4f} ± {cv_std:.4f}
  Threshold:     {THRESHOLD}
    """)
    print("[DONE]")


if __name__ == "__main__":
    main()