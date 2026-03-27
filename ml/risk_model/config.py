"""
설정 상수 모음

[타겟 정의 - 이진 분류]
0 = 정상
1 = 위험군 (전당뇨+당뇨 포함)
  → 확률값으로 low/mid/high 세분화
  → low:  0.35 ~ 0.50
  → mid:  0.50 ~ 0.70
  → high: 0.70 이상

당뇨 확진자는 가입 시 체크박스로 직접 선택 (모델 미사용)
데이터셋: diabetes_binary_5050split_health_indicators_BRFSS2015.csv (50:50 균형)
"""

SEED = 42

# 저장 경로
SAVE_DIR     = "saved_models"
DATA_PATH    = "diabetes_binary_5050split_health_indicators_BRFSS2015.csv"

# 모델 파일명
MODEL_FILE   = "diabetes_model_v3.pkl"
FEATURE_FILE = "feature_names_v3.pkl"
THRESHOLD_FILE = "threshold_v3.pkl"

# 기본 UX 친화 피처
BASE_FEATS = [
    "HighBP",               # 고혈압 여부 (체크박스)
    "HighChol",             # 고콜레스테롤 여부 (체크박스)
    "BMI",                  # 체질량지수 (키/몸무게 자동계산)
    "HeartDiseaseorAttack", # 심장병 경험 (체크박스)
    "HvyAlcoholConsump",    # 과도한 음주 (체크박스)
    "GenHlth",              # 전반적 건강상태 (드롭다운 1~5)
    "DiffWalk",             # 보행 어려움 (체크박스)
    "Sex",                  # 성별 (라디오버튼)
    "Age",                  # 나이 구간 (드롭다운)
]

# Forward 탐색 후보 피처 (UX 안전)
UX_CANDIDATES = [
    "Smoker",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "Stroke",
    "BMI_GenHlth",
    "Age_HighBP",
    "BMI_obese",
]

# 이진 분류 threshold
THRESHOLD = 0.35  # F1 최적값

# 위험군 확률 → low/mid/high 기준
RISK_LEVELS = {
    "low":  (0.35, 0.50),
    "mid":  (0.50, 0.70),
    "high": (0.70, 1.00),
}

# 서비스 메시지
RECOMMENDATIONS = {
    0: "현재 건강 상태가 양호합니다. 꾸준한 생활습관을 유지하세요.",
    1: {
        "low":  "당뇨 위험이 낮은 편이지만 생활습관 관리를 시작하세요.",
        "mid":  "당뇨 위험이 있습니다. 식단과 운동 개선이 필요합니다.",
        "high": "당뇨 위험이 높습니다. 적극적인 생활습관 개선이 필요합니다.",
    },
}

# LightGBM 기본 HP (이진 분류)
LGB_DEFAULT_HP = {
    "n_estimators":      500,
    "max_depth":         5,
    "learning_rate":     0.03,
    "num_leaves":        20,
    "min_child_samples": 50,
    "subsample":         0.8,
    "colsample_bytree":  0.8,
    "reg_alpha":         0.1,
    "reg_lambda":        1.0,
    "class_weight":      "balanced",
}

# HP 탐색 범위
HP_SEARCH_SPACE = {
    "max_depth":         [3, 4, 5, 6],
    "num_leaves":        [7, 10, 15, 20, 25],
    "learning_rate":     [0.01, 0.02, 0.03, 0.05],
    "min_child_samples": [30, 50, 80],
}