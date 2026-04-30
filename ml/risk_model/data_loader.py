"""
데이터 로드 및 전처리
"""
import pandas as pd
import numpy as np
from config import DATA_PATH, SEED


def load_data(path=DATA_PATH):
    """원본 데이터 로드 + 중복 제거 + 타겟 재정의"""
    df = pd.read_csv(path)
    df = df.drop_duplicates().reset_index(drop=True)

    # 타겟 재정의: 0+1(정상+전당뇨) vs 2(당뇨)
    df["target"] = (df["Diabetes_012"] == 2).astype(int)

    return df


def get_target(df):
    """타겟 벡터 반환"""
    return df["target"].values


def print_data_info(df):
    """데이터 기본 정보 출력"""
    y = get_target(df)
    print(f"  Shape: {df.shape}, 당뇨 비율: {y.mean():.1%}")
