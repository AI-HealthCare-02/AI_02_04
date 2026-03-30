"""
예측 함수 — 태기 FastAPI 서빙용 (이진 분류)

사용법:
    from predictor import RiskPredictor
    predictor = RiskPredictor()
    result = predictor.predict({ "HighBP": 1, "BMI": 30.0, ... })

반환:
    {
        "class_label": "위험군",
        "is_risk": true,
        "risk_level": "mid",       # 위험군일 때만
        "risk_score": 0.62,
        "top_risk_factors": [...],
        "recommendation": "..."
    }
"""

import os
import joblib
import numpy as np
import pandas as pd
from config import (
    SAVE_DIR, MODEL_FILE, FEATURE_FILE, THRESHOLD_FILE,
    RISK_LEVELS, RECOMMENDATIONS,
)


class RiskPredictor:

    def __init__(self):
        self.model         = joblib.load(os.path.join(SAVE_DIR, MODEL_FILE))
        self.feature_names = joblib.load(os.path.join(SAVE_DIR, FEATURE_FILE))
        self.threshold     = joblib.load(os.path.join(SAVE_DIR, THRESHOLD_FILE))
        print(f"  모델 로드 완료: {len(self.feature_names)}개 피처, threshold={self.threshold}")

    def _build_features(self, user_input: dict) -> pd.DataFrame:
        d = {f: 0 for f in self.feature_names}
        for k, v in user_input.items():
            if k in d:
                d[k] = v

        if "BMI_GenHlth" in self.feature_names:
            d["BMI_GenHlth"] = user_input.get("BMI", 0) * user_input.get("GenHlth", 0)
        if "Age_HighBP" in self.feature_names:
            d["Age_HighBP"]  = user_input.get("Age", 0) * user_input.get("HighBP", 0)
        if "BMI_obese" in self.feature_names:
            d["BMI_obese"]   = 1 if user_input.get("BMI", 0) >= 30 else 0

        return pd.DataFrame([d])[self.feature_names]

    def _get_risk_level(self, prob: float) -> str:
        for level, (low, high) in RISK_LEVELS.items():
            if low <= prob < high:
                return level
        return "high"

    def _get_top_risk_factors(self, X: pd.DataFrame, top_n: int = 3) -> list:
        feature_map = {
            "HighBP":               "고혈압",
            "HighChol":             "고콜레스테롤",
            "BMI":                  "높은 BMI",
            "HeartDiseaseorAttack": "심장 질환",
            "HvyAlcoholConsump":    "과도한 음주",
            "GenHlth":              "전반적 건강 상태",
            "DiffWalk":             "보행 어려움",
            "Age":                  "연령",
            "Sex":                  "성별",
            "BMI_GenHlth":          "BMI × 건강 상태",
            "Age_HighBP":           "고령 + 고혈압",
            "BMI_obese":            "비만",
            "Smoker":               "흡연",
            "PhysActivity":         "운동 부족",
            "Fruits":               "과일 섭취 부족",
            "Veggies":              "채소 섭취 부족",
        }

        importances = self.model.feature_importances_
        indices     = np.argsort(importances)[::-1]
        top_factors = []

        for i in indices:
            feat = self.feature_names[i]
            val  = X.iloc[0][feat]
            if val > 0 and feat in feature_map:
                top_factors.append(feature_map[feat])
            if len(top_factors) >= top_n:
                break

        return top_factors

    def predict(self, user_input: dict) -> dict:
        X       = self._build_features(user_input)
        prob    = float(self.model.predict_proba(X)[0][1])
        is_risk = prob >= self.threshold

        risk_level     = self._get_risk_level(prob) if is_risk else None
        top_factors    = self._get_top_risk_factors(X)

        if is_risk:
            rec = RECOMMENDATIONS[1][risk_level]
        else:
            rec = RECOMMENDATIONS[0]

        return {
            "class_label":       "위험군" if is_risk else "정상",
            "is_risk":           is_risk,
            "risk_level":        risk_level,
            "risk_score":        round(prob, 4),
            "top_risk_factors":  top_factors,
            "recommendation":    rec,
        }