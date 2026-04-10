"""
모델 학습 — 개별 모델 + Optuna HP 최적화
"""
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import (RandomForestClassifier, ExtraTreesClassifier,
                               GradientBoostingClassifier)
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
from config import SEED, N_ESTIMATORS, CV_FOLDS, OPTUNA_TRIALS_LGB, OPTUNA_TRIALS_XGB, OPTUNA_TRIALS_CAT

# 라이브러리 체크
HAS_LGB = HAS_XGB = HAS_CAT = HAS_OPTUNA = False
try:
    import lightgbm as lgb; HAS_LGB = True
except: pass
try:
    import xgboost as xgb; HAS_XGB = True
except: pass
try:
    import catboost as cb; HAS_CAT = True
except: pass
try:
    import optuna; HAS_OPTUNA = True
    optuna.logging.set_verbosity(optuna.logging.WARNING)
except: pass


def print_library_status():
    print(f"  LightGBM {'✓' if HAS_LGB else '✗'}")
    print(f"  XGBoost  {'✓' if HAS_XGB else '✗'}")
    print(f"  CatBoost {'✓' if HAS_CAT else '✗'}")
    print(f"  Optuna   {'✓' if HAS_OPTUNA else '✗'}")


def train_lightgbm(X_all, y, X_train, y_train):
    """LightGBM + Optuna HP 최적화"""
    if not HAS_LGB:
        return None, None
    print("\n  --- LightGBM + Optuna ---")

    if HAS_OPTUNA:
        def objective(trial):
            p = {'n_estimators': N_ESTIMATORS,
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'num_leaves': trial.suggest_int('num_leaves', 7, 80),
                'learning_rate': trial.suggest_float('learning_rate', 0.003, 0.1, log=True),
                'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
                'scale_pos_weight': trial.suggest_float('scale_pos_weight', 2.0, 10.0),
                'subsample': trial.suggest_float('subsample', 0.4, 0.95),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.4, 0.95),
                'reg_alpha': trial.suggest_float('reg_alpha', 1e-5, 10, log=True),
                'reg_lambda': trial.suggest_float('reg_lambda', 1e-5, 10, log=True),
                'min_split_gain': trial.suggest_float('min_split_gain', 0, 2),
                'random_state': SEED, 'n_jobs': -1, 'verbose': -1}
            skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
            aucs = [roc_auc_score(y[vai],
                    lgb.LGBMClassifier(**p).fit(X_all[tri], y[tri]).predict_proba(X_all[vai])[:, 1])
                    for tri, vai in skf.split(X_all, y)]
            return np.mean(aucs)

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=OPTUNA_TRIALS_LGB)
        bp = {**study.best_params, 'n_estimators': N_ESTIMATORS,
              'random_state': SEED, 'n_jobs': -1, 'verbose': -1}
        print(f"  Optuna best CV: {study.best_value:.4f}")
    else:
        bp = {'n_estimators': N_ESTIMATORS, 'max_depth': 6, 'num_leaves': 20,
              'learning_rate': 0.02, 'min_child_samples': 30, 'scale_pos_weight': 5.5,
              'subsample': 0.8, 'colsample_bytree': 0.8, 'reg_alpha': 0.1, 'reg_lambda': 1.0,
              'random_state': SEED, 'n_jobs': -1, 'verbose': -1}

    model = lgb.LGBMClassifier(**bp)
    model.fit(X_train, y_train)
    return model, bp


def train_xgboost(X_all, y, X_train, y_train):
    """XGBoost + Optuna HP 최적화"""
    if not HAS_XGB:
        return None, None
    print("\n  --- XGBoost + Optuna ---")

    if HAS_OPTUNA:
        def objective(trial):
            p = {'n_estimators': N_ESTIMATORS,
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.003, 0.1, log=True),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 60),
                'scale_pos_weight': trial.suggest_float('scale_pos_weight', 2.0, 10.0),
                'subsample': trial.suggest_float('subsample', 0.4, 0.95),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.4, 0.95),
                'reg_alpha': trial.suggest_float('reg_alpha', 1e-5, 10, log=True),
                'reg_lambda': trial.suggest_float('reg_lambda', 1e-5, 10, log=True),
                'gamma': trial.suggest_float('gamma', 0, 7),
                'random_state': SEED, 'n_jobs': -1, 'eval_metric': 'auc'}
            skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
            aucs = [roc_auc_score(y[vai],
                    xgb.XGBClassifier(**p).fit(X_all[tri], y[tri], verbose=False).predict_proba(X_all[vai])[:, 1])
                    for tri, vai in skf.split(X_all, y)]
            return np.mean(aucs)

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=OPTUNA_TRIALS_XGB)
        bp = {**study.best_params, 'n_estimators': N_ESTIMATORS,
              'random_state': SEED, 'n_jobs': -1, 'eval_metric': 'auc'}
        print(f"  Optuna best CV: {study.best_value:.4f}")
    else:
        bp = {'n_estimators': N_ESTIMATORS, 'max_depth': 5, 'learning_rate': 0.03,
              'min_child_weight': 30, 'scale_pos_weight': 5.5, 'subsample': 0.8,
              'colsample_bytree': 0.8, 'reg_alpha': 0.1, 'reg_lambda': 1.0, 'gamma': 0.1,
              'random_state': SEED, 'n_jobs': -1, 'eval_metric': 'auc'}

    model = xgb.XGBClassifier(**bp)
    model.fit(X_train, y_train, verbose=False)
    return model, bp


def train_catboost(X_all, y, X_train, y_train):
    """CatBoost + Optuna HP 최적화"""
    if not HAS_CAT:
        return None, None
    print("\n  --- CatBoost + Optuna ---")

    if HAS_OPTUNA:
        def objective(trial):
            p = {'iterations': N_ESTIMATORS,
                'depth': trial.suggest_int('depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.003, 0.1, log=True),
                'l2_leaf_reg': trial.suggest_float('l2_leaf_reg', 1e-5, 10, log=True),
                'border_count': trial.suggest_int('border_count', 32, 255),
                'scale_pos_weight': trial.suggest_float('scale_pos_weight', 2.0, 10.0),
                'random_strength': trial.suggest_float('random_strength', 0, 5),
                'bagging_temperature': trial.suggest_float('bagging_temperature', 0, 5),
                'random_seed': SEED, 'verbose': 0}
            skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
            aucs = [roc_auc_score(y[vai],
                    cb.CatBoostClassifier(**p).fit(X_all[tri], y[tri]).predict_proba(X_all[vai])[:, 1])
                    for tri, vai in skf.split(X_all, y)]
            return np.mean(aucs)

        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=OPTUNA_TRIALS_CAT)
        bp = {**study.best_params, 'iterations': N_ESTIMATORS, 'random_seed': SEED, 'verbose': 0}
        print(f"  Optuna best CV: {study.best_value:.4f}")
    else:
        bp = {'iterations': N_ESTIMATORS, 'depth': 5, 'learning_rate': 0.03,
              'l2_leaf_reg': 1.0, 'scale_pos_weight': 5.5, 'random_seed': SEED, 'verbose': 0}

    model = cb.CatBoostClassifier(**bp)
    model.fit(X_train, y_train)
    return model, bp


def train_sklearn_models(X_train, y_train):
    """sklearn 기반 모델 4종 학습"""
    results = {}

    print("\n  --- RandomForest ---")
    m_rf = RandomForestClassifier(n_estimators=500, max_depth=12, min_samples_leaf=10,
        class_weight='balanced', random_state=SEED, n_jobs=-1)
    m_rf.fit(X_train, y_train)
    results['RF'] = (m_rf, m_rf.get_params())

    print("  --- ExtraTrees ---")
    m_et = ExtraTreesClassifier(n_estimators=500, max_depth=12, min_samples_leaf=10,
        class_weight='balanced', random_state=SEED, n_jobs=-1)
    m_et.fit(X_train, y_train)
    results['ET'] = (m_et, m_et.get_params())

    print("  --- GradientBoosting (sklearn) ---")
    m_gb = GradientBoostingClassifier(n_estimators=300, max_depth=5,
        learning_rate=0.05, subsample=0.8, random_state=SEED)
    m_gb.fit(X_train, y_train)
    results['GBM'] = (m_gb, m_gb.get_params())

    print("  --- LogisticRegression ---")
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    m_lr = LogisticRegression(max_iter=1000, class_weight='balanced', C=0.1, random_state=SEED)
    m_lr.fit(X_train_s, y_train)
    results['LR'] = (m_lr, m_lr.get_params())

    return results, scaler
