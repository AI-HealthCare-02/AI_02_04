"""
피처 엔지니어링 — RiskCount 파생 피처 생성
"""
import pandas as pd
import numpy as np


def create_risk_count(df):
    """
    RiskCount: 위험 요인 겹침 횟수 (0~5)
    - 기존 입력 피처에서 자동 계산 (사용자 추가 입력 없음)
    - 위험 요인이 겹칠수록 당뇨 위험이 급격히 증가
    - Feature Importance 3위 달성
    """
    df["RiskCount"] = (
        df["HighBP"]
        + df["HighChol"]
        + df["HeartDiseaseorAttack"]
        + df["DiffWalk"]
        + (df["GenHlth"] >= 4).astype(int)
    )
    return df


def compute_risk_count(input_data: dict) -> int:
    """
    단일 입력에 대한 RiskCount 계산 (서빙용)
    백엔드에서 predict 호출 전에 사용
    """
    return (
        input_data.get("HighBP", 0)
        + input_data.get("HighChol", 0)
        + input_data.get("HeartDiseaseorAttack", 0)
        + input_data.get("DiffWalk", 0)
        + (1 if input_data.get("GenHlth", 0) >= 4 else 0)
    )
