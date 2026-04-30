"""
학습된 CV 모델로 음식 이미지 추론.

사용법:
    from ml.food_model.inference import FoodPredictor
    predictor = FoodPredictor()
    result = predictor.predict("비빔밥사진.jpg")
    # result = {"food_name": "비빔밥", "confidence": 0.95, "top3": [...]}
"""
import os
import json
import torch
import torch.nn as nn
from torch.cuda.amp import autocast
from torchvision import transforms, models
from PIL import Image

IMG_SIZE = 300
CROP_SIZE = 280
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "food_model.pth")
CLASS_MAP_PATH = os.path.join(MODEL_DIR, "class_map.json")


class FoodPredictor:
    """음식 이미지 분류기. 서버 시작 시 1회 로드, 이후 반복 추론."""

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()
        self.transform = transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.CenterCrop(CROP_SIZE),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def _load_model(self):
        """모델 + 클래스 매핑 로드."""
        checkpoint = torch.load(MODEL_PATH, map_location=self.device, weights_only=False)
        self.idx_to_class = checkpoint["idx_to_class"]
        num_classes = checkpoint["num_classes"]

        self.model = models.efficientnet_b4(weights=None)
        self.model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(self.model.classifier[1].in_features, num_classes)
        )
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model = self.model.to(self.device)
        self.model.eval()
        print(f"[FoodPredictor] 모델 로드 완료 ({num_classes}개 클래스, {self.device})")

    def predict(self, image_path: str) -> dict:
        """
        이미지 경로를 받아 음식 분류 결과 반환.

        Returns:
            {
                "food_name": "비빔밥",
                "confidence": 0.95,
                "top3": [
                    {"name": "비빔밥", "confidence": 0.95},
                    {"name": "볶음밥", "confidence": 0.03},
                    {"name": "김밥", "confidence": 0.01}
                ]
            }
        """
        image = Image.open(image_path).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            with autocast():
                outputs = self.model(input_tensor)
            probs = torch.softmax(outputs, dim=1)
            top3_prob, top3_idx = probs.topk(3, 1, True, True)

        top3 = []
        for i in range(3):
            idx = top3_idx[0][i].item()
            prob = top3_prob[0][i].item()
            name = self.idx_to_class.get(idx, f"unknown_{idx}")
            top3.append({"name": name, "confidence": round(prob, 4)})

        return {
            "food_name": top3[0]["name"],
            "confidence": top3[0]["confidence"],
            "top3": top3,
        }


# 직접 실행 시 테스트
if __name__ == "__main__":
    import sys
    predictor = FoodPredictor()
    if len(sys.argv) > 1:
        result = predictor.predict(sys.argv[1])
        print(f"\n  음식: {result['food_name']} ({result['confidence']*100:.1f}%)")
        for i, item in enumerate(result['top3']):
            print(f"  {i+1}. {item['name']}: {item['confidence']*100:.1f}%")
    else:
        print("  사용법: python inference.py 이미지경로.jpg")