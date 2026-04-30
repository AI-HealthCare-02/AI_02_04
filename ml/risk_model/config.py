"""
설정 파일 — 피처 목록, 상수, 경로
"""
import os

# 랜덤 시드
SEED = 42

# 저장 경로
SAVE_DIR = "saved_models"

# 데이터 경로
DATA_PATH = "diabetes_012_health_indicators_BRFSS2015.csv"

# 사용자 입력 피처 9개 (기능 구현서 동일)
USER_FEATS = [
    "HighBP",                # 고혈압 여부
    "HighChol",              # 고콜레스테롤 여부
    "BMI",                   # 체질량지수 (키/몸무게 자동 계산)
    "HeartDiseaseorAttack",  # 심장 질환 여부
    "HvyAlcoholConsump",     # 과도한 음주 여부
    "GenHlth",               # 전반적 건강 상태 (1~5)
    "DiffWalk",              # 보행 어려움 여부
    "Sex",                   # 성별 (0=여, 1=남)
    "Age",                   # 나이 구간 (1~13)
]

# 모델 내부 피처 10개 (사용자 입력 9개 + RiskCount 파생)
MODEL_FEATS = USER_FEATS + ["RiskCount"]

# 테스트 비율
TEST_SIZE = 0.2

# Optuna 설정
OPTUNA_TRIALS_LGB = 150
OPTUNA_TRIALS_XGB = 150
OPTUNA_TRIALS_CAT = 100

# 모델 설정
N_ESTIMATORS = 1000
CV_FOLDS = 5

# Multi-Seed
MULTI_SEEDS = [42, 2024, 7, 123, 999, 314, 555, 888, 1337, 2025]
