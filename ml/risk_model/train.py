"""
메인 학습 스크립트 — 전체 파이프라인 실행

실행: python train.py
소요: 약 40~60분
"""
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

from config import SEED, SAVE_DIR, MODEL_FEATS, USER_FEATS, TEST_SIZE
from data_loader import load_data, get_target, print_data_info
from feature_engineering import create_risk_count
from trainer import (print_library_status, train_lightgbm, train_xgboost,
                     train_catboost, train_sklearn_models)
from evaluator import (compare_models, run_stacking, run_weighted_blend,
                       run_multi_seed, optimize_threshold, print_report, run_cv)
from predictor import verify_model

np.random.seed(SEED)

# ============================================================
# 1. 데이터 준비
# ============================================================
print("\n" + "=" * 60)
print("  당뇨 예측 — 궁극의 최종 모델")
print("  (기능 구현서 완벽 호환, 모든 기법 총동원)")
print("=" * 60)

print_library_status()
df = load_data()
df = create_risk_count(df)
y = get_target(df)
print_data_info(df)
print(f"  사용자 입력: {len(USER_FEATS)}개, 모델 피처: {len(MODEL_FEATS)}개")

X_all = df[MODEL_FEATS].values
X_train, X_valid, y_train, y_valid = train_test_split(
    X_all, y, test_size=TEST_SIZE, random_state=SEED, stratify=y)
print(f"  Train: {len(y_train)}, Valid: {len(y_valid)}")

# ============================================================
# 2. 부스팅 3종 + Optuna
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 1: 부스팅 3종 + Optuna")
print("=" * 60)

models = {}
probs = {}

# LightGBM
m, bp = train_lightgbm(X_all, y, X_train, y_train)
if m:
    probs['LGB'] = m.predict_proba(X_valid)[:, 1]
    models['LGB'] = (m, bp)
    print(f"  LightGBM AUC: {roc_auc_score(y_valid, probs['LGB']):.4f}")

# XGBoost
m, bp = train_xgboost(X_all, y, X_train, y_train)
if m:
    probs['XGB'] = m.predict_proba(X_valid)[:, 1]
    models['XGB'] = (m, bp)
    print(f"  XGBoost AUC: {roc_auc_score(y_valid, probs['XGB']):.4f}")

# CatBoost
m, bp = train_catboost(X_all, y, X_train, y_train)
if m:
    probs['CAT'] = m.predict_proba(X_valid)[:, 1]
    models['CAT'] = (m, bp)
    print(f"  CatBoost AUC: {roc_auc_score(y_valid, probs['CAT']):.4f}")

# ============================================================
# 3. 앙상블 기반 모델 4종
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 2: 앙상블 기반 4종")
print("=" * 60)

sklearn_models, scaler = train_sklearn_models(X_train, y_train)
for name, (m, p) in sklearn_models.items():
    if name == 'LR':
        from sklearn.preprocessing import StandardScaler
        probs[name] = m.predict_proba(scaler.transform(X_valid))[:, 1]
    else:
        probs[name] = m.predict_proba(X_valid)[:, 1]
    models[name] = (m, p)
    print(f"  {name} AUC: {roc_auc_score(y_valid, probs[name]):.4f}")

# ============================================================
# 4. 개별 모델 비교
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 3: 개별 모델 비교")
print("=" * 60)
sorted_models = compare_models(probs, y_valid)

# ============================================================
# 5. Stacking
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 4: 7-모델 Stacking (OOF 5-Fold)")
print("=" * 60)
stack_prob, stack_auc, stack_name = run_stacking(models, X_all, y, X_valid, y_valid)
print(f"\n  최고: {stack_name} → {stack_auc:.4f}")

# ============================================================
# 6. Weighted Blend
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 5: Weighted Blend")
print("=" * 60)
blend_auc, blend_weights = run_weighted_blend(probs, y_valid)
if blend_weights:
    print(f"  Boost Blend: {blend_weights}\n  AUC: {blend_auc:.4f}")

# ============================================================
# 7. Multi-Seed
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 6: Multi-Seed x10")
print("=" * 60)
best_single_name = sorted_models[0][0]
best_single_model, best_single_params = models[best_single_name]
multi_prob, multi_auc = run_multi_seed(
    best_single_model, best_single_params, best_single_name,
    X_train, y_train, X_valid, y_valid)
print(f"  {best_single_name} x10 seeds: {multi_auc:.4f}")

# ============================================================
# 8. 최종 비교
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 7: 최종 비교")
print("=" * 60)

candidates = {}
for n, p in sorted_models:
    candidates[f"{n} (단독)"] = p
candidates[f"Stacking ({stack_name})"] = stack_prob
candidates[f"{best_single_name} x10seeds"] = multi_prob
if blend_weights:
    candidates["Boost Blend"] = sum(w * probs[n] for n, w in blend_weights.items())

print(f"\n  {'방법':30s} {'AUC':>8s}")
print("  " + "-" * 40)
best_name = None
best_auc = 0
best_prob_final = None
for n, p in sorted(candidates.items(), key=lambda x: -roc_auc_score(y_valid, x[1])):
    a = roc_auc_score(y_valid, p)
    star = " ★" if a > best_auc else ""
    if a > best_auc:
        best_auc = a
        best_name = n
        best_prob_final = p
    print(f"  {n:30s} {a:8.4f}{star}")
print(f"\n  최고: {best_name} → AUC={best_auc:.4f}")

# ============================================================
# 9. Threshold 최적화
# ============================================================
print(f"\n{'=' * 60}")
print("  PHASE 8: Threshold 최적화")
print("=" * 60)
best_th = optimize_threshold(best_prob_final, y_valid)
print(f"\n  최적 Threshold: {best_th:.2f}")
print(f"\n  AUC: {best_auc:.4f}\n")
print_report(best_prob_final, y_valid, best_th)

# 5-Fold CV
print(f"  [5-Fold CV — {best_single_name}]")
cv_mean, cv_std = run_cv(best_single_model, best_single_params, best_single_name, X_all, y)
print(f"  5-Fold CV: {cv_mean:.4f} ± {cv_std:.4f}")

# ============================================================
# 10. 모델 저장
# ============================================================
print(f"\n{'=' * 60}")
print("  모델 저장")
print("=" * 60)
os.makedirs(SAVE_DIR, exist_ok=True)
joblib.dump(best_single_model, os.path.join(SAVE_DIR, 'diabetes_model_v3.pkl'))
joblib.dump(MODEL_FEATS, os.path.join(SAVE_DIR, 'feature_names_v3.pkl'))
joblib.dump(best_th, os.path.join(SAVE_DIR, 'threshold_v3.pkl'))
print(f"  diabetes_model_v3.pkl   ← {best_single_name}")
print(f"  feature_names_v3.pkl    ← {len(MODEL_FEATS)}개 (사용자 {len(USER_FEATS)}개 + RiskCount)")
print(f"  threshold_v3.pkl        ← {best_th:.2f}")

if hasattr(best_single_model, 'feature_importances_'):
    print(f"\n  [Feature Importance — {best_single_name}]")
    imp = pd.DataFrame({'f': MODEL_FEATS, 'i': best_single_model.feature_importances_})
    imp = imp.sort_values('i', ascending=False)
    for _, r in imp.iterrows():
        print(f"    {r['f']:25s}: {r['i']:.0f}")

# ============================================================
# 11. 검증
# ============================================================
print(f"\n{'=' * 60}")
print("  검증")
print("=" * 60)
verify_model()

# ============================================================
# 12. 최종 요약
# ============================================================
print(f"\n{'=' * 60}")
print("  최종 요약")
print("=" * 60)
print(f"""
  [기능 구현서 완벽 호환]
  사용자 입력: {len(USER_FEATS)}개 (변경 없음)
  모델 피처: {len(MODEL_FEATS)}개 (+RiskCount 파생)

  [개별 모델]""")
for n, p in sorted_models:
    print(f"    {n:15s}: {roc_auc_score(y_valid, p):.4f}")
print(f"""
  [앙상블]
    Stacking ({stack_name}): {stack_auc:.4f}
    Multi-Seed x10:    {multi_auc:.4f}""")
if blend_weights:
    print(f"    Boost Blend:       {blend_auc:.4f}")
print(f"""
  최고: {best_name} → AUC={best_auc:.4f}
  저장: {best_single_name} (단독 모델)
  5-Fold CV: {cv_mean:.4f} ± {cv_std:.4f}
  Threshold: {best_th:.2f}
""")
print("[DONE]")
