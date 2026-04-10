# 당마고치 CV 모델 — 음식 이미지 분류

## 모델 정보
- **아키텍처**: EfficientNet-B4 (Transfer Learning)
- **클래스**: 51개 한국 음식
- **성능**: Top-1 96.5% | Top-3 99.8%
- **모델 크기**: 68MB
- **학습 데이터**: AIHub "건강관리를 위한 음식 이미지" (10만장)
- **학습 환경**: RTX 5080 Laptop GPU, 198분

## 파일 구조
food_model/
├── food_model.pth    # 학습된 모델 가중치
├── class_map.json    # 클래스 인덱스 ↔ 음식명 매핑
├── config.py         # 학습 하이퍼파라미터
├── dataset.py        # 데이터셋 클래스
├── train.py          # 학습 코드
├── inference.py      # 추론 코드 (백엔드 연동용)
└── README.md

## 백엔드 연동 
```python
from ml.food_model.inference import FoodPredictor

# 서버 시작 시 1회 로드
predictor = FoodPredictor()

# 추론 (반복 호출 가능)
result = predictor.predict("비빔밥사진.jpg")
# {"food_name": "비빔밥", "confidence": 0.95, "top3": [...]}
```

## 학습 재현
```bash
pip install torch torchvision
python train.py
```

## 학습 기법
- 2단계 학습 (에폭 1~5: 분류층만 → 에폭 6~: 전체 Fine-tuning)
- Mixed Precision (AMP) — 속도 30~50% 향상
- Label Smoothing 0.1 — 과신뢰 방지
- WeightedRandomSampler — 클래스 불균형 해결
- Warmup 1에폭 + CosineAnnealing
- Early Stopping (3에폭 미개선 시 종료)
