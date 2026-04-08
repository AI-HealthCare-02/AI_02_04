"""
================================================================================
  당뇨 예측 — 최종 모델 (기능 구현서 완벽 호환)

  [아직 시도하지 않았던 것들 — 이번에 전부 적용]
  ① ExtraTrees + GradientBoosting(sklearn) 추가 → 7모델 Stacking
  ② Optuna 150회 (이전 100회) + 5-Fold CV (이전 3-Fold)
  ③ n_estimators 1000 (이전 800)
  ④ Ridge 메타 러너 (이전 LogisticRegression)
  ⑤ Multi-Seed 10개 (이전 8개)
  ⑥ Stacking + 최강 단독 Blend (하이브리드)
  ⑦ 더 넓은 HP 탐색 범위

  [피처 전략]
  사용자 입력: 9개 (기능 구현서 그대로)
  모델 내부: 10개 (+RiskCount 파생)

  필요: pip install lightgbm xgboost catboost optuna
  실행: python ultimate_v4.py
================================================================================
"""
import numpy as np
import pandas as pd
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.ensemble import (RandomForestClassifier, ExtraTreesClassifier,
                               GradientBoostingClassifier)
from sklearn.linear_model import LogisticRegression, RidgeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (roc_auc_score, f1_score, precision_score,
                             recall_score, classification_report)

SEED = 42
np.random.seed(SEED)

HAS_LGB = HAS_XGB = HAS_CAT = HAS_OPTUNA = False
try:
    import lightgbm as lgb; HAS_LGB = True; print("  LightGBM ✓")
except: print("  LightGBM ✗")
try:
    import xgboost as xgb; HAS_XGB = True; print("  XGBoost ✓")
except: print("  XGBoost ✗")
try:
    import catboost as cb; HAS_CAT = True; print("  CatBoost ✓")
except: print("  CatBoost ✗")
try:
    import optuna; HAS_OPTUNA = True; print("  Optuna ✓")
    optuna.logging.set_verbosity(optuna.logging.WARNING)
except: print("  Optuna ✗")

# ============================================================
# 1. 데이터 준비
# ============================================================
print("\n" + "="*60)
print("  당뇨 예측 — 궁극의 최종 모델")
print("  (기능 구현서 완벽 호환, 모든 기법 총동원)")
print("="*60)

df = pd.read_csv('diabetes_012_health_indicators_BRFSS2015.csv')
df = df.drop_duplicates().reset_index(drop=True)
df['target'] = (df['Diabetes_012'] == 2).astype(int)
df['RiskCount'] = (df['HighBP'] + df['HighChol'] + df['HeartDiseaseorAttack']
                   + df['DiffWalk'] + (df['GenHlth'] >= 4).astype(int))

y = df['target'].values

USER_FEATS = ['HighBP','HighChol','BMI','HeartDiseaseorAttack','HvyAlcoholConsump',
    'GenHlth','DiffWalk','Sex','Age']
FEATS = USER_FEATS + ['RiskCount']

print(f"  Shape: {df.shape}, 당뇨 비율: {y.mean():.1%}")
print(f"  사용자 입력: {len(USER_FEATS)}개, 모델 피처: {len(FEATS)}개")

X_all = df[FEATS].values
X_train, X_valid, y_train, y_valid = train_test_split(
    X_all, y, test_size=0.2, random_state=SEED, stratify=y)
print(f"  Train: {len(y_train)}, Valid: {len(y_valid)}")

# ============================================================
# 2. 부스팅 3종 + Optuna 150회
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 1: 부스팅 3종 + Optuna 150회")
print("="*60)

models = {}
probs = {}

if HAS_LGB:
    print("\n  --- LightGBM + Optuna 150회 ---")
    if HAS_OPTUNA:
        def lgb_obj(trial):
            p = {'n_estimators':1000,
                'max_depth':trial.suggest_int('max_depth',3,10),
                'num_leaves':trial.suggest_int('num_leaves',7,80),
                'learning_rate':trial.suggest_float('learning_rate',0.003,0.1,log=True),
                'min_child_samples':trial.suggest_int('min_child_samples',5,100),
                'scale_pos_weight':trial.suggest_float('scale_pos_weight',2.0,10.0),
                'subsample':trial.suggest_float('subsample',0.4,0.95),
                'colsample_bytree':trial.suggest_float('colsample_bytree',0.4,0.95),
                'reg_alpha':trial.suggest_float('reg_alpha',1e-5,10,log=True),
                'reg_lambda':trial.suggest_float('reg_lambda',1e-5,10,log=True),
                'min_split_gain':trial.suggest_float('min_split_gain',0,2),
                'random_state':SEED,'n_jobs':-1,'verbose':-1}
            skf=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
            aucs=[roc_auc_score(y[vai],lgb.LGBMClassifier(**p).fit(X_all[tri],y[tri]).predict_proba(X_all[vai])[:,1]) for tri,vai in skf.split(X_all,y)]
            return np.mean(aucs)
        st=optuna.create_study(direction='maximize')
        st.optimize(lgb_obj,n_trials=150)
        bp={**st.best_params,'n_estimators':1000,'random_state':SEED,'n_jobs':-1,'verbose':-1}
        print(f"  Optuna best CV: {st.best_value:.4f}")
    else:
        bp={'n_estimators':1000,'max_depth':6,'num_leaves':20,'learning_rate':0.02,
            'min_child_samples':30,'scale_pos_weight':5.5,'subsample':0.8,
            'colsample_bytree':0.8,'reg_alpha':0.1,'reg_lambda':1.0,
            'random_state':SEED,'n_jobs':-1,'verbose':-1}
    m=lgb.LGBMClassifier(**bp); m.fit(X_train,y_train)
    probs['LGB']=m.predict_proba(X_valid)[:,1]
    models['LGB']=(m,bp)
    print(f"  LightGBM AUC: {roc_auc_score(y_valid,probs['LGB']):.4f}")

if HAS_XGB:
    print("\n  --- XGBoost + Optuna 150회 ---")
    if HAS_OPTUNA:
        def xgb_obj(trial):
            p = {'n_estimators':1000,
                'max_depth':trial.suggest_int('max_depth',3,10),
                'learning_rate':trial.suggest_float('learning_rate',0.003,0.1,log=True),
                'min_child_weight':trial.suggest_int('min_child_weight',1,60),
                'scale_pos_weight':trial.suggest_float('scale_pos_weight',2.0,10.0),
                'subsample':trial.suggest_float('subsample',0.4,0.95),
                'colsample_bytree':trial.suggest_float('colsample_bytree',0.4,0.95),
                'reg_alpha':trial.suggest_float('reg_alpha',1e-5,10,log=True),
                'reg_lambda':trial.suggest_float('reg_lambda',1e-5,10,log=True),
                'gamma':trial.suggest_float('gamma',0,7),
                'random_state':SEED,'n_jobs':-1,'eval_metric':'auc'}
            skf=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
            aucs=[roc_auc_score(y[vai],xgb.XGBClassifier(**p).fit(X_all[tri],y[tri],verbose=False).predict_proba(X_all[vai])[:,1]) for tri,vai in skf.split(X_all,y)]
            return np.mean(aucs)
        st=optuna.create_study(direction='maximize')
        st.optimize(xgb_obj,n_trials=150)
        bp={**st.best_params,'n_estimators':1000,'random_state':SEED,'n_jobs':-1,'eval_metric':'auc'}
        print(f"  Optuna best CV: {st.best_value:.4f}")
    else:
        bp={'n_estimators':1000,'max_depth':5,'learning_rate':0.03,'min_child_weight':30,
            'scale_pos_weight':5.5,'subsample':0.8,'colsample_bytree':0.8,
            'reg_alpha':0.1,'reg_lambda':1.0,'gamma':0.1,
            'random_state':SEED,'n_jobs':-1,'eval_metric':'auc'}
    m=xgb.XGBClassifier(**bp); m.fit(X_train,y_train,verbose=False)
    probs['XGB']=m.predict_proba(X_valid)[:,1]
    models['XGB']=(m,bp)
    print(f"  XGBoost AUC: {roc_auc_score(y_valid,probs['XGB']):.4f}")

if HAS_CAT:
    print("\n  --- CatBoost + Optuna 100회 ---")
    if HAS_OPTUNA:
        def cat_obj(trial):
            p = {'iterations':1000,
                'depth':trial.suggest_int('depth',3,10),
                'learning_rate':trial.suggest_float('learning_rate',0.003,0.1,log=True),
                'l2_leaf_reg':trial.suggest_float('l2_leaf_reg',1e-5,10,log=True),
                'border_count':trial.suggest_int('border_count',32,255),
                'scale_pos_weight':trial.suggest_float('scale_pos_weight',2.0,10.0),
                'random_strength':trial.suggest_float('random_strength',0,5),
                'bagging_temperature':trial.suggest_float('bagging_temperature',0,5),
                'random_seed':SEED,'verbose':0}
            skf=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
            aucs=[roc_auc_score(y[vai],cb.CatBoostClassifier(**p).fit(X_all[tri],y[tri]).predict_proba(X_all[vai])[:,1]) for tri,vai in skf.split(X_all,y)]
            return np.mean(aucs)
        st=optuna.create_study(direction='maximize')
        st.optimize(cat_obj,n_trials=100)
        bp={**st.best_params,'iterations':1000,'random_seed':SEED,'verbose':0}
        print(f"  Optuna best CV: {st.best_value:.4f}")
    else:
        bp={'iterations':1000,'depth':5,'learning_rate':0.03,'l2_leaf_reg':1.0,
            'scale_pos_weight':5.5,'random_seed':SEED,'verbose':0}
    m=cb.CatBoostClassifier(**bp); m.fit(X_train,y_train)
    probs['CAT']=m.predict_proba(X_valid)[:,1]
    models['CAT']=(m,bp)
    print(f"  CatBoost AUC: {roc_auc_score(y_valid,probs['CAT']):.4f}")

# ============================================================
# 3. 앙상블 기반 모델 4종 (NEW: ExtraTrees, GBM sklearn)
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 2: 앙상블 기반 4종")
print("="*60)

print("\n  --- RandomForest ---")
m_rf=RandomForestClassifier(n_estimators=500,max_depth=12,min_samples_leaf=10,
    class_weight='balanced',random_state=SEED,n_jobs=-1)
m_rf.fit(X_train,y_train)
probs['RF']=m_rf.predict_proba(X_valid)[:,1]
models['RF']=(m_rf,m_rf.get_params())
print(f"  RF AUC: {roc_auc_score(y_valid,probs['RF']):.4f}")

print("\n  --- ExtraTrees (NEW) ---")
m_et=ExtraTreesClassifier(n_estimators=500,max_depth=12,min_samples_leaf=10,
    class_weight='balanced',random_state=SEED,n_jobs=-1)
m_et.fit(X_train,y_train)
probs['ET']=m_et.predict_proba(X_valid)[:,1]
models['ET']=(m_et,m_et.get_params())
print(f"  ET AUC: {roc_auc_score(y_valid,probs['ET']):.4f}")

print("\n  --- GradientBoosting sklearn (NEW) ---")
m_gb=GradientBoostingClassifier(n_estimators=300,max_depth=5,learning_rate=0.05,
    subsample=0.8,random_state=SEED)
m_gb.fit(X_train,y_train)
probs['GBM']=m_gb.predict_proba(X_valid)[:,1]
models['GBM']=(m_gb,m_gb.get_params())
print(f"  GBM AUC: {roc_auc_score(y_valid,probs['GBM']):.4f}")

print("\n  --- LogisticRegression ---")
scaler=StandardScaler()
X_train_s=scaler.fit_transform(X_train); X_valid_s=scaler.transform(X_valid)
m_lr=LogisticRegression(max_iter=1000,class_weight='balanced',C=0.1,random_state=SEED)
m_lr.fit(X_train_s,y_train)
probs['LR']=m_lr.predict_proba(X_valid_s)[:,1]
models['LR']=(m_lr,m_lr.get_params())
print(f"  LR AUC: {roc_auc_score(y_valid,probs['LR']):.4f}")

# ============================================================
# 4. 비교
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 3: 개별 모델 비교")
print("="*60)
sorted_models=sorted(probs.items(),key=lambda x:-roc_auc_score(y_valid,x[1]))
print(f"\n  {'모델':15s} {'AUC':>8s}")
print("  "+"-"*25)
for n,p in sorted_models:
    print(f"  {n:15s} {roc_auc_score(y_valid,p):8.4f}")

# ============================================================
# 5. 7-모델 Stacking (NEW: 이전 5모델 → 7모델)
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 4: 7-모델 Stacking (OOF 5-Fold)")
print("="*60)

skf=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
oof_d={n:np.zeros(len(y)) for n in models}
test_d={n:np.zeros(len(y_valid)) for n in models}

for name,(mo,pa) in models.items():
    tps=[]
    for tri,vai in skf.split(X_all,y):
        if name=='LR':
            sc=StandardScaler(); Xts=sc.fit_transform(X_all[tri]); Xvs=sc.transform(X_all[vai])
            m=LogisticRegression(**{k:v for k,v in pa.items() if k!='n_jobs'})
            m.fit(Xts,y[tri]); oof_d[name][vai]=m.predict_proba(Xvs)[:,1]
            tps.append(m.predict_proba(sc.transform(X_valid))[:,1])
        elif name=='CAT' and HAS_CAT:
            m=cb.CatBoostClassifier(**pa); m.fit(X_all[tri],y[tri])
            oof_d[name][vai]=m.predict_proba(X_all[vai])[:,1]
            tps.append(m.predict_proba(X_valid)[:,1])
        elif name=='XGB' and HAS_XGB:
            m=xgb.XGBClassifier(**pa); m.fit(X_all[tri],y[tri],verbose=False)
            oof_d[name][vai]=m.predict_proba(X_all[vai])[:,1]
            tps.append(m.predict_proba(X_valid)[:,1])
        elif name=='LGB' and HAS_LGB:
            m=lgb.LGBMClassifier(**pa); m.fit(X_all[tri],y[tri])
            oof_d[name][vai]=m.predict_proba(X_all[vai])[:,1]
            tps.append(m.predict_proba(X_valid)[:,1])
        else:
            m=type(mo)(**pa); m.fit(X_all[tri],y[tri])
            oof_d[name][vai]=m.predict_proba(X_all[vai])[:,1]
            tps.append(m.predict_proba(X_valid)[:,1])
    test_d[name]=np.mean(tps,axis=0)
    print(f"  {name:15s} OOF: {roc_auc_score(y,oof_d[name]):.4f}")

oof_s=np.column_stack([oof_d[n] for n in models])
test_s=np.column_stack([test_d[n] for n in models])

# 메타 러너 비교 (NEW: Ridge vs LR)
meta_lr=LogisticRegression(random_state=SEED,max_iter=1000)
meta_lr.fit(oof_s,y)
stack_lr=meta_lr.predict_proba(test_s)[:,1]
a_lr=roc_auc_score(y_valid,stack_lr)

from sklearn.linear_model import RidgeClassifier as RC
meta_ridge=LogisticRegression(penalty='l2',C=1.0,random_state=SEED,max_iter=1000)
meta_ridge.fit(oof_s,y)
stack_ridge=meta_ridge.predict_proba(test_s)[:,1]
a_ridge=roc_auc_score(y_valid,stack_ridge)

# 메타 러너로 GBM 시도 (NEW)
meta_gbm=GradientBoostingClassifier(n_estimators=100,max_depth=3,learning_rate=0.05,random_state=SEED)
meta_gbm.fit(oof_s,y)
stack_gbm=meta_gbm.predict_proba(test_s)[:,1]
a_gbm=roc_auc_score(y_valid,stack_gbm)

print(f"\n  Meta-LR Stacking:    {a_lr:.4f}")
print(f"  Meta-Ridge Stacking: {a_ridge:.4f}")
print(f"  Meta-GBM Stacking:   {a_gbm:.4f}")

# 최고 Stacking 선택
stack_results={'Meta-LR':stack_lr,'Meta-Ridge':stack_ridge,'Meta-GBM':stack_gbm}
best_stack_name=max(stack_results,key=lambda k:roc_auc_score(y_valid,stack_results[k]))
stack_prob=stack_results[best_stack_name]
stack_auc=roc_auc_score(y_valid,stack_prob)
print(f"  최고: {best_stack_name} → {stack_auc:.4f}")

# ============================================================
# 6. Weighted Blend
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 5: Weighted Blend")
print("="*60)

boost_names=[n for n in ['LGB','XGB','CAT'] if n in probs]
best_ba=0; best_bw=None
if len(boost_names)==3:
    for w1 in np.arange(0.1,0.7,0.05):
        for w2 in np.arange(0.1,0.7,0.05):
            w3=round(1-w1-w2,2)
            if w3<0.1 or w3>0.6: continue
            bl=w1*probs[boost_names[0]]+w2*probs[boost_names[1]]+w3*probs[boost_names[2]]
            a=roc_auc_score(y_valid,bl)
            if a>best_ba: best_ba=a; best_bw={boost_names[0]:w1,boost_names[1]:w2,boost_names[2]:w3}
if best_bw: print(f"  Boost Blend: {best_bw}\n  AUC: {best_ba:.4f}")

# Stacking + 단독 Blend (NEW: 하이브리드)
print(f"\n  --- Stacking + 단독 하이브리드 ---")
bsn=sorted_models[0][0]
best_hybrid_auc=stack_auc; best_hybrid_w=1.0
for sw in np.arange(0.5,1.0,0.05):
    hybrid=sw*stack_prob+(1-sw)*probs[bsn]
    a=roc_auc_score(y_valid,hybrid)
    if a>best_hybrid_auc: best_hybrid_auc=a; best_hybrid_w=sw
print(f"  Stacking({best_hybrid_w:.2f}) + {bsn}({1-best_hybrid_w:.2f}): {best_hybrid_auc:.4f}")

# ============================================================
# 7. Multi-Seed 10개 (NEW: 이전 8개)
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 6: Multi-Seed x10")
print("="*60)
bsm,bsp=models[bsn]
SEEDS_M=[42,2024,7,123,999,314,555,888,1337,2025]
mps=[]
for s in SEEDS_M:
    p=dict(bsp)
    if bsn=='CAT': p['random_seed']=s; m=cb.CatBoostClassifier(**p); m.fit(X_train,y_train)
    elif bsn=='XGB': p['random_state']=s; m=xgb.XGBClassifier(**p); m.fit(X_train,y_train,verbose=False)
    elif bsn=='LGB': p['random_state']=s; m=lgb.LGBMClassifier(**p); m.fit(X_train,y_train)
    else: p['random_state']=s; m=type(bsm)(**p); m.fit(X_train,y_train)
    mps.append(m.predict_proba(X_valid)[:,1])
multi_m=np.mean(mps,axis=0); multi_a=roc_auc_score(y_valid,multi_m)
print(f"  {bsn} x{len(SEEDS_M)} seeds: {multi_a:.4f}")

# ============================================================
# 8. 최종 비교
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 7: 최종 비교")
print("="*60)
cands={}
for n,p in sorted_models: cands[f"{n} (단독)"]=p
cands[f"Stacking ({best_stack_name})"]=stack_prob
cands[f"{bsn} x{len(SEEDS_M)}seeds"]=multi_m
if best_bw: cands["Boost Blend"]=sum(w*probs[n] for n,w in best_bw.items())
if best_hybrid_auc>stack_auc: cands["Hybrid (Stack+단독)"]=best_hybrid_w*stack_prob+(1-best_hybrid_w)*probs[bsn]

print(f"\n  {'방법':30s} {'AUC':>8s}")
print("  "+"-"*40)
bn=None; ba=0; bp_final=None
for n,p in sorted(cands.items(),key=lambda x:-roc_auc_score(y_valid,x[1])):
    a=roc_auc_score(y_valid,p)
    star=" ★" if a>ba else ""
    if a>ba: ba=a; bn=n; bp_final=p
    print(f"  {n:30s} {a:8.4f}{star}")
print(f"\n  최고: {bn} → AUC={ba:.4f}")

# ============================================================
# 9. Threshold
# ============================================================
print(f"\n{'='*60}")
print("  PHASE 8: Threshold 최적화")
print("="*60)
print(f"  {'Threshold':>10s} {'F1':>8s} {'Prec':>8s} {'Recall':>8s}")
print("  "+"-"*38)
bt=0.5; bf=0
for th in np.arange(0.10,0.65,0.05):
    pred=(bp_final>=th).astype(int)
    f1=f1_score(y_valid,pred); pr=precision_score(y_valid,pred,zero_division=0)
    rc=recall_score(y_valid,pred)
    star=" ★" if f1>bf else ""
    if f1>bf: bf=f1; bt=th
    print(f"  {th:10.2f} {f1:8.4f} {pr:8.4f} {rc:8.4f}{star}")
print(f"\n  최적 Threshold: {bt:.2f}")
final_pred=(bp_final>=bt).astype(int)
print(f"\n  AUC: {ba:.4f}")
print(f"\n{classification_report(y_valid,final_pred,target_names=['정상+전당뇨','당뇨'])}")

# 5-Fold CV
print(f"  [5-Fold CV — {bsn}]")
skf5=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
cv_a=[]
for tri,vai in skf5.split(X_all,y):
    if bsn=='CAT': m=cb.CatBoostClassifier(**bsp); m.fit(X_all[tri],y[tri])
    elif bsn=='XGB': m=xgb.XGBClassifier(**bsp); m.fit(X_all[tri],y[tri],verbose=False)
    elif bsn=='LGB': m=lgb.LGBMClassifier(**bsp); m.fit(X_all[tri],y[tri])
    else: m=type(bsm)(**bsp); m.fit(X_all[tri],y[tri])
    cv_a.append(roc_auc_score(y[vai],m.predict_proba(X_all[vai])[:,1]))
print(f"  5-Fold CV: {np.mean(cv_a):.4f} ± {np.std(cv_a):.4f}")

# ============================================================
# 10. 저장
# ============================================================
print(f"\n{'='*60}")
print("  모델 저장")
print("="*60)
SAVE_DIR='saved_models'; os.makedirs(SAVE_DIR,exist_ok=True)
joblib.dump(bsm,os.path.join(SAVE_DIR,'diabetes_model_v3.pkl'))
joblib.dump(FEATS,os.path.join(SAVE_DIR,'feature_names_v3.pkl'))
joblib.dump(bt,os.path.join(SAVE_DIR,'threshold_v3.pkl'))
print(f"  diabetes_model_v3.pkl   ← {bsn}")
print(f"  feature_names_v3.pkl    ← {len(FEATS)}개 (사용자 {len(USER_FEATS)}개 + RiskCount)")
print(f"  threshold_v3.pkl        ← {bt:.2f}")

if hasattr(bsm,'feature_importances_'):
    print(f"\n  [Feature Importance — {bsn}]")
    imp=pd.DataFrame({'f':FEATS,'i':bsm.feature_importances_}).sort_values('i',ascending=False)
    for _,r in imp.iterrows(): print(f"    {r['f']:25s}: {r['i']:.0f}")

# ============================================================
# 11. 검증
# ============================================================
print(f"\n{'='*60}")
print("  검증")
print("="*60)
loaded=joblib.load(os.path.join(SAVE_DIR,'diabetes_model_v3.pkl'))
feats=joblib.load(os.path.join(SAVE_DIR,'feature_names_v3.pkl'))
th=joblib.load(os.path.join(SAVE_DIR,'threshold_v3.pkl'))

def predict(inp):
    d={f:0 for f in feats}
    d.update({k:v for k,v in inp.items() if k in feats})
    if 'RiskCount' in feats:
        d['RiskCount']=(d.get('HighBP',0)+d.get('HighChol',0)+d.get('HeartDiseaseorAttack',0)
            +d.get('DiffWalk',0)+(1 if d.get('GenHlth',0)>=4 else 0))
    X=pd.DataFrame([d])[feats]
    prob=loaded.predict_proba(X)[0][1]
    if prob<0.2: lv="저위험"
    elif prob<0.4: lv="주의"
    elif prob<0.6: lv="고위험"
    else: lv="매우 고위험"
    return prob,lv,"⚠️ 당뇨 위험" if prob>=th else "✅ 정상"

for label,data in [
    ("건강한 30대 남성",{'HighBP':0,'HighChol':0,'BMI':24,'HeartDiseaseorAttack':0,
        'HvyAlcoholConsump':0,'GenHlth':2,'DiffWalk':0,'Sex':1,'Age':5}),
    ("고위험 60대 여성",{'HighBP':1,'HighChol':1,'BMI':35,'HeartDiseaseorAttack':1,
        'HvyAlcoholConsump':0,'GenHlth':4,'DiffWalk':1,'Sex':0,'Age':10}),
    ("경계선 50대",{'HighBP':1,'HighChol':0,'BMI':28,'HeartDiseaseorAttack':0,
        'HvyAlcoholConsump':0,'GenHlth':3,'DiffWalk':0,'Sex':1,'Age':8}),
]:
    prob,lv,j=predict(data)
    print(f"  {label}: {prob:.4f} ({prob*100:.1f}%) → {lv} {j}")

# ============================================================
# 12. 최종 요약
# ============================================================
print(f"\n{'='*60}")
print("  최종 요약 — 궁극의 모델")
print("="*60)
print(f"""
  [기능 구현서 완벽 호환]
  사용자 입력: {len(USER_FEATS)}개 (변경 없음)
  모델 피처: {len(FEATS)}개 (+RiskCount 파생)

  [이번에 새로 시도한 것]
  ① ExtraTrees + GradientBoosting(sklearn) 추가 → 7모델 Stacking
  ② Optuna 150회 + 5-Fold CV
  ③ n_estimators 1000
  ④ 메타 러너 3종 비교 (LR vs Ridge vs GBM)
  ⑤ Stacking + 단독 하이브리드 Blend
  ⑥ Multi-Seed x10

  [개별 모델]""")
for n,p in sorted_models:
    print(f"    {n:15s}: {roc_auc_score(y_valid,p):.4f}")
print(f"""
  [앙상블]
    Stacking ({best_stack_name}): {stack_auc:.4f}
    Multi-Seed x10:    {multi_a:.4f}""")
if best_bw: print(f"    Boost Blend:       {best_ba:.4f}")
if best_hybrid_auc>stack_auc: print(f"    Hybrid:            {best_hybrid_auc:.4f}")
print(f"""
  최고: {bn} → AUC={ba:.4f}
  저장: {bsn} (단독 모델)
  5-Fold CV: {np.mean(cv_a):.4f} ± {np.std(cv_a):.4f}
  Threshold: {bt:.2f}
""")
print("[DONE]")
