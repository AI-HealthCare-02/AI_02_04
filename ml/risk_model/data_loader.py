"""
데이터 로드 — 이진 분류
0 = 정상, 1 = 위험군
데이터셋: diabetes_binary_5050split (50:50 균형)
"""

import numpy as np
import pandas as pd
from config import DATA_PATH


def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df = df.drop_duplicates().reset_index(drop=True)

    # 타겟 컬럼 자동 감지
    if "Diabetes_binary" in df.columns:
        df["target"] = df["Diabetes_binary"].astype(int)
    else:
        df["target"] = df["Diabetes_012"].astype(int)

    print(f"  데이터 로드 완료: {df.shape}")
    print(f"  0 (정상):   {(df['target']==0).mean():.1%}")
    print(f"  1 (위험군): {(df['target']==1).mean():.1%}")
    return df


def get_labels(df: pd.DataFrame) -> np.ndarray:
    return df["target"].values