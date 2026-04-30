"""
평가 — Stacking, Weighted Blend, Threshold 최적화
"""
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (roc_auc_score, f1_score, precision_score,
                             recall_score, classification_report)
from config import SEED, CV_FOLDS, MULTI_SEEDS

# 라이브러리 체크
try:
    import lightgbm as lgb; HAS_LGB = True
except: HAS_LGB = False
try:
    import xgboost as xgb; HAS_XGB = True
except: HAS_XGB = False
try:
    import catboost as cb; HAS_CAT = True
except: HAS_CAT = False


def compare_models(probs, y_valid):
    """개별 모델 AUC 비교"""
    sorted_models = sorted(probs.items(), key=lambda x: -roc_auc_score(y_valid, x[1]))
    print(f"\n  {'모델':15s} {'AUC':>8s}")
    print("  " + "-" * 25)
    for n, p in sorted_models:
        print(f"  {n:15s} {roc_auc_score(y_valid, p):8.4f}")
    return sorted_models


def run_stacking(models, X_all, y, X_valid, y_valid):
    """7-모델 OOF Stacking"""
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    oof_d = {n: np.zeros(len(y)) for n in models}
    test_d = {n: np.zeros(len(y_valid)) for n in models}

    for name, (mo, pa) in models.items():
        tps = []
        for tri, vai in skf.split(X_all, y):
            if name == 'LR':
                sc = StandardScaler()
                Xts = sc.fit_transform(X_all[tri])
                Xvs = sc.transform(X_all[vai])
                m = LogisticRegression(**{k: v for k, v in pa.items() if k != 'n_jobs'})
                m.fit(Xts, y[tri])
                oof_d[name][vai] = m.predict_proba(Xvs)[:, 1]
                tps.append(m.predict_proba(sc.transform(X_valid))[:, 1])
            elif name == 'CAT' and HAS_CAT:
                m = cb.CatBoostClassifier(**pa); m.fit(X_all[tri], y[tri])
                oof_d[name][vai] = m.predict_proba(X_all[vai])[:, 1]
                tps.append(m.predict_proba(X_valid)[:, 1])
            elif name == 'XGB' and HAS_XGB:
                m = xgb.XGBClassifier(**pa); m.fit(X_all[tri], y[tri], verbose=False)
                oof_d[name][vai] = m.predict_proba(X_all[vai])[:, 1]
                tps.append(m.predict_proba(X_valid)[:, 1])
            elif name == 'LGB' and HAS_LGB:
                m = lgb.LGBMClassifier(**pa); m.fit(X_all[tri], y[tri])
                oof_d[name][vai] = m.predict_proba(X_all[vai])[:, 1]
                tps.append(m.predict_proba(X_valid)[:, 1])
            else:
                m = type(mo)(**pa); m.fit(X_all[tri], y[tri])
                oof_d[name][vai] = m.predict_proba(X_all[vai])[:, 1]
                tps.append(m.predict_proba(X_valid)[:, 1])
        test_d[name] = np.mean(tps, axis=0)
        print(f"  {name:15s} OOF: {roc_auc_score(y, oof_d[name]):.4f}")

    # 메타 러너 3종 비교
    oof_s = np.column_stack([oof_d[n] for n in models])
    test_s = np.column_stack([test_d[n] for n in models])

    meta_lr = LogisticRegression(random_state=SEED, max_iter=1000)
    meta_lr.fit(oof_s, y)
    stack_lr = meta_lr.predict_proba(test_s)[:, 1]

    meta_ridge = LogisticRegression(penalty='l2', C=1.0, random_state=SEED, max_iter=1000)
    meta_ridge.fit(oof_s, y)
    stack_ridge = meta_ridge.predict_proba(test_s)[:, 1]

    meta_gbm = GradientBoostingClassifier(n_estimators=100, max_depth=3,
        learning_rate=0.05, random_state=SEED)
    meta_gbm.fit(oof_s, y)
    stack_gbm = meta_gbm.predict_proba(test_s)[:, 1]

    results = {'Meta-LR': stack_lr, 'Meta-Ridge': stack_ridge, 'Meta-GBM': stack_gbm}
    for name, prob in results.items():
        print(f"  {name} Stacking: {roc_auc_score(y_valid, prob):.4f}")

    best_name = max(results, key=lambda k: roc_auc_score(y_valid, results[k]))
    return results[best_name], roc_auc_score(y_valid, results[best_name]), best_name


def run_weighted_blend(probs, y_valid):
    """부스팅 3종 Weighted Blend"""
    boost_names = [n for n in ['LGB', 'XGB', 'CAT'] if n in probs]
    best_auc = 0
    best_weights = None

    if len(boost_names) == 3:
        for w1 in np.arange(0.1, 0.7, 0.05):
            for w2 in np.arange(0.1, 0.7, 0.05):
                w3 = round(1 - w1 - w2, 2)
                if w3 < 0.1 or w3 > 0.6:
                    continue
                bl = w1 * probs[boost_names[0]] + w2 * probs[boost_names[1]] + w3 * probs[boost_names[2]]
                a = roc_auc_score(y_valid, bl)
                if a > best_auc:
                    best_auc = a
                    best_weights = {boost_names[0]: w1, boost_names[1]: w2, boost_names[2]: w3}

    return best_auc, best_weights


def run_multi_seed(best_model, best_params, best_name, X_train, y_train, X_valid, y_valid):
    """Multi-Seed 앙상블"""
    multi_probs = []
    for s in MULTI_SEEDS:
        p = dict(best_params)
        if best_name == 'CAT':
            p['random_seed'] = s
            m = cb.CatBoostClassifier(**p); m.fit(X_train, y_train)
        elif best_name == 'XGB':
            p['random_state'] = s
            m = xgb.XGBClassifier(**p); m.fit(X_train, y_train, verbose=False)
        elif best_name == 'LGB':
            p['random_state'] = s
            m = lgb.LGBMClassifier(**p); m.fit(X_train, y_train)
        else:
            p['random_state'] = s
            m = type(best_model)(**p); m.fit(X_train, y_train)
        multi_probs.append(m.predict_proba(X_valid)[:, 1])

    multi_mean = np.mean(multi_probs, axis=0)
    return multi_mean, roc_auc_score(y_valid, multi_mean)


def optimize_threshold(probs, y_valid):
    """F1 기반 Threshold 최적화"""
    print(f"  {'Threshold':>10s} {'F1':>8s} {'Prec':>8s} {'Recall':>8s}")
    print("  " + "-" * 38)
    best_th = 0.5
    best_f1 = 0
    for th in np.arange(0.10, 0.65, 0.05):
        pred = (probs >= th).astype(int)
        f1 = f1_score(y_valid, pred)
        prec = precision_score(y_valid, pred, zero_division=0)
        rec = recall_score(y_valid, pred)
        star = " ★" if f1 > best_f1 else ""
        if f1 > best_f1:
            best_f1 = f1
            best_th = th
        print(f"  {th:10.2f} {f1:8.4f} {prec:8.4f} {rec:8.4f}{star}")
    return best_th


def print_report(probs, y_valid, threshold):
    """Classification Report 출력"""
    pred = (probs >= threshold).astype(int)
    print(classification_report(y_valid, pred, target_names=['정상+전당뇨', '당뇨']))


def run_cv(best_model, best_params, best_name, X_all, y):
    """5-Fold CV"""
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    cv_aucs = []
    for tri, vai in skf.split(X_all, y):
        if best_name == 'CAT':
            m = cb.CatBoostClassifier(**best_params); m.fit(X_all[tri], y[tri])
        elif best_name == 'XGB':
            m = xgb.XGBClassifier(**best_params); m.fit(X_all[tri], y[tri], verbose=False)
        elif best_name == 'LGB':
            m = lgb.LGBMClassifier(**best_params); m.fit(X_all[tri], y[tri])
        else:
            m = type(best_model)(**best_params); m.fit(X_all[tri], y[tri])
        cv_aucs.append(roc_auc_score(y[vai], m.predict_proba(X_all[vai])[:, 1]))
    return np.mean(cv_aucs), np.std(cv_aucs)
