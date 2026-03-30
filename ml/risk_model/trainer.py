"""
모델 학습 + HP 탐색 — 이진 분류
"""

import numpy as np
from sklearn.metrics import roc_auc_score
from feature_engineering import eval_cv
from config import SEED, HP_SEARCH_SPACE

try:
    import lightgbm as lgb  # type: ignore
    HAS_LGB = True
    print("  LightGBM ✓")
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier
    HAS_LGB = False
    print("  LightGBM 없음 → GradientBoosting 사용")


def make_boost_model(hp: dict):
    if HAS_LGB:
        return lgb.LGBMClassifier(  # type: ignore
            n_estimators=500,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            class_weight="balanced",
            random_state=SEED,
            n_jobs=-1,
            verbose=-1,
            **{k: v for k, v in hp.items()
               if k in ["max_depth", "num_leaves", "learning_rate", "min_child_samples"]},
        )
    else:
        from sklearn.ensemble import GradientBoostingClassifier
        return GradientBoostingClassifier(
            subsample=0.8, random_state=SEED,
            **{k: v for k, v in hp.items()
               if k in ["n_estimators", "max_depth", "learning_rate"]},
        )


def search_hp(df, y, final_feats: list) -> dict:
    print(f"\n{'='*60}")
    print("  HP 탐색 (이진 분류)")
    print("=" * 60)

    best_auc = 0
    best_hp  = {}

    if HAS_LGB:
        configs = [
            {"max_depth": md, "num_leaves": nl,
             "learning_rate": lr, "min_child_samples": mc}
            for md in HP_SEARCH_SPACE["max_depth"]
            for nl in HP_SEARCH_SPACE["num_leaves"]
            for lr in HP_SEARCH_SPACE["learning_rate"]
            for mc in HP_SEARCH_SPACE["min_child_samples"]
        ]
        print(f"  {len(configs)}개 조합 탐색 중...")

        for i, cfg in enumerate(configs):
            def mk(c=cfg.copy()):
                return make_boost_model(c)
            auc, _ = eval_cv(df, y, final_feats, mk)
            if auc > best_auc:
                best_auc = auc
                best_hp  = cfg.copy()
                print(f"  ★ [{i+1}] d={cfg['max_depth']}, nl={cfg['num_leaves']}, "
                      f"lr={cfg['learning_rate']}, mc={cfg['min_child_samples']}: {auc:.4f}")
    else:
        from sklearn.ensemble import GradientBoostingClassifier
        for n in [200, 300, 500]:
            for md in [4, 5, 6]:
                for lr in [0.02, 0.05]:
                    def mk(n=n, md=md, lr=lr):
                        return GradientBoostingClassifier(
                            n_estimators=n, max_depth=md,
                            learning_rate=lr, subsample=0.8, random_state=SEED,
                        )
                    auc, _ = eval_cv(df, y, final_feats, mk)
                    if auc > best_auc:
                        best_auc = auc
                        best_hp  = {"n_estimators": n, "max_depth": md, "learning_rate": lr}
                        print(f"  ★ n={n}, d={md}, lr={lr}: {auc:.4f}")

    print(f"\n  최고 HP: {best_hp}")
    return best_hp


def train_model(X_train, y_train, X_valid, y_valid, best_hp: dict):
    print(f"\n{'='*60}")
    print("  모델 학습 (이진 분류)")
    print("=" * 60)

    model = make_boost_model(best_hp.copy())
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_valid)[:, 1]
    auc   = roc_auc_score(y_valid, proba)
    print(f"  AUC: {auc:.4f}")

    return model, auc