"""
Food Image Classifier Connector — 이미지 식단 분석 서브 모듈.

이 모듈의 역할:
- 독립 기능이 아니라 추천 엔진의 '입력 품질'을 높이는 서브 모듈.
- 사용자가 식단 사진을 올리면 → 음식 분류 → 영양소 조회 → 추천 엔진에 주입.

데이터 흐름:
1. 사용자 식단 사진 업로드
2. 이미지 분류 모델 → 음식 Top-3 후보 + 신뢰도
3. 사용자 확인/수정 (측정의 질 관리)
4. 확정된 음식명 → 영양성분 DB 조회
5. 영양소 데이터 → C1(Context Assembler)의 recent_meals에 주입
6. C3(Recommendation Generator)가 식단 반영 추천 생성

MVP: 더미 분류 + 더미 영양 DB
Production: EfficientNet-B0 + 식품의약품안전처 영양성분 API
"""
import logging
from dataclasses import dataclass
from typing import Optional
import os
import json
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


@dataclass
class FoodClassificationResult:
    food_name: str
    confidence: float
    alternatives: list  # [{"name": "된장찌개", "confidence": 0.85}]


@dataclass
class NutritionInfo:
    food_name: str
    serving_size: str
    calories: float
    carbohydrate: float
    protein: float
    fat: float
    sodium: float        # mg — 고혈압 관리에 핵심
    sugar: float         # g — 당뇨 관리에 핵심
    fiber: float
    cholesterol: float
    gi_index: int = 0    # 혈당지수 — 당뇨 관리 핵심


@dataclass
class FoodAnalysisResult:
    classification: FoodClassificationResult
    nutrition: Optional[NutritionInfo]
    health_notes: list[str]  # ["나트륨 함량이 높습니다", ...]


class FoodImageClassifier:
    """
    식단 이미지 → 음식 분류 → 영양소 조회.
    MVP: 더미 데이터. Production: 모델 + API.
    """

    def __init__(self, mode: str = "dummy"):
        self.mode = mode
        self._nutrition_db = self._load_dummy_nutrition_db()

    async def analyze(self, image_path: str) -> FoodAnalysisResult:
        """
        식단 이미지를 분석하여 음식 분류 + 영양소 정보를 반환.

        Args:
            image_path: 업로드된 이미지 경로

        Returns:
            FoodAnalysisResult: 분류 결과 + 영양 정보 + 건강 노트
        """
        # Step 1: 이미지 분류
        classification = await self._classify_image(image_path)
        logger.info(
            f"Food classified: {classification.food_name} "
            f"(conf={classification.confidence:.2f})"
        )

        # Step 2: 영양소 조회
        nutrition = self._lookup_nutrition(classification.food_name)

        # Step 3: 건강 노트 생성
        health_notes = self._generate_health_notes(nutrition)

        return FoodAnalysisResult(
            classification=classification,
            nutrition=nutrition,
            health_notes=health_notes,
        )

    async def _classify_image(self, image_path: str) -> FoodClassificationResult:
        """
        이미지 분류.
        1순위: GPT-4o Vision
        2순위: 더미 결과 (API 실패 시)
        """
        if self.mode == "dummy":
            return self._dummy_classification(image_path)

        # GPT-4o Vision으로 음식 분류
        try:
            import base64
            load_dotenv()
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            # 이미지를 base64로 인코딩
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "이 음식 사진을 분석해주세요. "
                                    "반드시 아래 JSON 형식으로만 응답하세요.\n"
                                    '{"food_name":"음식이름","confidence":0.0~1.0,'
                                    '"alternatives":[{"name":"후보1","confidence":0.0~1.0},'
                                    '{"name":"후보2","confidence":0.0~1.0}],'
                                    '"nutrition":{"calories":숫자,"carbohydrate":숫자,'
                                    '"protein":숫자,"fat":숫자,"sodium":숫자,'
                                    '"sugar":숫자,"fiber":숫자,"cholesterol":숫자,'
                                    '"gi_index":숫자,"serving_size":"1인분 (000g)"},'
                                    '"healthier_alternative":{"name":"대안음식명","reason":"추천이유"}}\n'
                                    "JSON만 출력하세요."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )

            content = response.choices[0].message.content
            # JSON 블록 추출 (```json ... ``` 형태 대응)
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            parsed = json.loads(content)
            logger.info(f"GPT-4o Vision 분류: {parsed.get('food_name')}")

            # 영양소 정보도 GPT-4o가 추정했으면 DB에 추가
            if "nutrition" in parsed:
                n = parsed["nutrition"]
                self._nutrition_db[parsed["food_name"]] = NutritionInfo(
                    food_name=parsed["food_name"],
                    serving_size=n.get("serving_size", "1인분"),
                    calories=n.get("calories", 0),
                    carbohydrate=n.get("carbohydrate", 0),
                    protein=n.get("protein", 0),
                    fat=n.get("fat", 0),
                    sodium=n.get("sodium", 0),
                    sugar=n.get("sugar", 0),
                    fiber=n.get("fiber", 0),
                    cholesterol=n.get("cholesterol", 0),
                    gi_index=n.get("gi_index", 0),
                )

            # 대안 음식 정보를 저장
            if "healthier_alternative" in parsed:
                self._last_alternative = parsed["healthier_alternative"]
            else:
                self._last_alternative = None

            return FoodClassificationResult(
                food_name=parsed["food_name"],
                confidence=parsed.get("confidence", 0.85),
                alternatives=parsed.get("alternatives", []),
            )

        except Exception as e:
            logger.error(f"GPT-4o Vision 실패: {e}, 더미로 대체")
            return self._dummy_classification(image_path)

    def _dummy_classification(
        self, image_path: str
    ) -> FoodClassificationResult:
        """MVP용 더미 분류 결과."""
        # 파일명에 따라 다른 결과 반환 (테스트 용이성)
        if "kimchi" in image_path.lower():
            return FoodClassificationResult(
                food_name="김치찌개",
                confidence=0.91,
                alternatives=[
                    {"name": "된장찌개", "confidence": 0.72},
                    {"name": "순두부찌개", "confidence": 0.65},
                ],
            )
        elif "salad" in image_path.lower():
            return FoodClassificationResult(
                food_name="샐러드",
                confidence=0.88,
                alternatives=[
                    {"name": "채소비빔밥", "confidence": 0.45},
                    {"name": "콥샐러드", "confidence": 0.40},
                ],
            )
        else:
            # 기본값: 된장찌개
            return FoodClassificationResult(
                food_name="된장찌개",
                confidence=0.92,
                alternatives=[
                    {"name": "청국장", "confidence": 0.78},
                    {"name": "김치찌개", "confidence": 0.65},
                ],
            )

    def _lookup_nutrition(self, food_name: str) -> Optional[NutritionInfo]:
        """
        영양성분 DB에서 조회.
        MVP: 더미 DB. Production: 식품의약품안전처 API.
        """
        return self._nutrition_db.get(food_name)

    def _generate_health_notes(
        self, nutrition: Optional[NutritionInfo]
    ) -> list[str]:
        """영양 정보 기반 건강 노트를 생성. Rule-based."""
        if not nutrition:
            return ["영양 정보를 조회할 수 없습니다."]

        notes = []

        # 나트륨 체크 (고혈압 관리 핵심)
        if nutrition.sodium >= 1500:
            notes.append(
                f"나트륨 함량이 {nutrition.sodium:.0f}mg으로 높습니다. "
                f"고혈압 관리를 위해 하루 2,000mg 이하를 목표로 해보세요."
            )
        elif nutrition.sodium >= 800:
            notes.append(
                f"나트륨 함량이 {nutrition.sodium:.0f}mg입니다. "
                f"다음 끼니에는 저염식을 선택해보세요."
            )

        # 당류 체크 (당뇨 관리 핵심)
        if nutrition.sugar >= 15:
            notes.append(
                f"당류가 {nutrition.sugar:.0f}g으로 높은 편입니다. "
                f"식후 혈당 상승에 주의하세요."
            )

        # 칼로리
        if nutrition.calories >= 700:
            notes.append(
                f"칼로리가 {nutrition.calories:.0f}kcal로 높은 편입니다."
            )

        # 식이섬유 (긍정적 피드백)
        if nutrition.fiber >= 5:
            notes.append(
                f"식이섬유가 {nutrition.fiber:.0f}g으로 충분합니다. "
                f"혈당 관리에 도움이 됩니다."
            )

        if not notes:
            notes.append("전반적으로 균형 잡힌 식사입니다.")

        return notes

    async def analyze_by_name(self, food_name: str) -> FoodAnalysisResult:
        """
        음식명으로 영양소를 추정한다.
        CV 모델이 잘못 분류했을 때 사용자가 직접 입력하는 경우.
        PUT /diet/{id}/manual에서 호출.
        """
        # 1순위: 더미 DB에 있으면 바로 반환
        nutrition = self._lookup_nutrition(food_name)
        if nutrition:
            classification = FoodClassificationResult(
                food_name=food_name, confidence=1.0, alternatives=[]
            )
            health_notes = self._generate_health_notes(nutrition)
            return FoodAnalysisResult(
                classification=classification,
                nutrition=nutrition,
                health_notes=health_notes,
            )

        # 2순위: LLM으로 영양소 추정
        try:
            load_dotenv()
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"'{food_name}' 1인분의 영양소를 추정해주세요. "
                            "반드시 아래 JSON 형식으로만 응답하세요.\n"
                            '{"calories":숫자,"carbohydrate":숫자,'
                            '"protein":숫자,"fat":숫자,"sodium":숫자,'
                            '"sugar":숫자,"fiber":숫자,"cholesterol":숫자,'
                            '"gi_index":숫자,"serving_size":"1인분 (000g)"},'
                            '"healthier_alternative":{"name":"대안음식명","reason":"추천이유"}}\n'
                            "JSON만 출력하세요."
                        ),
                    }
                ],
                max_tokens=300,
            )

            content = response.choices[0].message.content
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            n = json.loads(content)

            nutrition = NutritionInfo(
                food_name=food_name,
                serving_size=n.get("serving_size", "1인분"),
                calories=n.get("calories", 0),
                carbohydrate=n.get("carbohydrate", 0),
                protein=n.get("protein", 0),
                fat=n.get("fat", 0),
                sodium=n.get("sodium", 0),
                sugar=n.get("sugar", 0),
                fiber=n.get("fiber", 0),
                cholesterol=n.get("cholesterol", 0),
                gi_index=n.get("gi_index", 0),
            )

            # DB에 추가
            self._nutrition_db[food_name] = nutrition
            logger.info(f"LLM 영양소 추정 완료: {food_name}")

            # 대안 음식 정보 저장
            if "healthier_alternative" in n:
                self._last_alternative = n["healthier_alternative"]
            else:
                self._last_alternative = None

        except Exception as e:
            logger.error(f"LLM 영양소 추정 실패: {e}")
            nutrition = None

        classification = FoodClassificationResult(
            food_name=food_name, confidence=1.0, alternatives=[]
        )
        health_notes = self._generate_health_notes(nutrition)

        return FoodAnalysisResult(
            classification=classification,
            nutrition=nutrition,
            health_notes=health_notes,
        )

    def nutrition_to_context(
        self, nutrition: Optional[NutritionInfo]
    ) -> dict:
        """
        영양 정보를 추천 엔진의 Context에 주입할 형태로 변환.
        이 메서드가 '이미지 분석 → 추천 엔진 연동'의 핵심 브릿지.
        """
        if not nutrition:
            return {}

        return {
            "food_name": nutrition.food_name,
            "calories": nutrition.calories,
            "sodium_mg": nutrition.sodium,
            "sugar_g": nutrition.sugar,
            "fiber_g": nutrition.fiber,
            "is_high_sodium": nutrition.sodium >= 1500,
            "is_high_sugar": nutrition.sugar >= 15,
        }

    def to_api_response(self, result: FoodAnalysisResult, user_type: str = "", goal: str = "") -> dict:
        """
        FoodAnalysisResult를 태균 API 응답 형식으로 변환.
        POST /diet/analyze 응답 포맷에 맞춤.
        """
        n = result.nutrition
        if not n:
            return {
                "food_name": result.classification.food_name,
                "calories": 0, "carbs": 0, "protein": 0,
                "sugar": 0, "fiber": 0, "gi_index": 0,
                "diet_score": 0, "highlight": "calories",
                "health_notes": result.health_notes,
            }

        # diet_score 계산 (0~100, 높을수록 당뇨에 좋은 식단)
        score = 100
        if n.sodium >= 1500: score -= 20
        if n.sugar >= 15: score -= 20
        if n.calories >= 700: score -= 15
        if n.gi_index >= 70: score -= 15
        if n.fiber >= 5: score += 10
        if n.protein >= 20: score += 5
        diet_score = max(0, min(100, score))

        # highlight 결정 (태균 서비스 플로우 4.2 반영)
        if user_type == "normal" and goal == "diet":
            highlight = "calories"
        elif user_type == "normal" and goal == "fitness":
            highlight = "protein"
        elif user_type in ("risk", "diabetes"):
            highlight = "carbs"
        else:
            highlight = "calories"

        return {
            "food_name": result.classification.food_name,
            "calories": n.calories,
            "carbs": n.carbohydrate,
            "protein": n.protein,
            "sugar": n.sugar,
            "fiber": n.fiber,
            "gi_index": n.gi_index,
            "diet_score": diet_score,
            "highlight": highlight,
            "health_notes": result.health_notes,
            "healthier_alternative": getattr(self, '_last_alternative', None),
            "classification": {
                "confidence": result.classification.confidence,
                "alternatives": result.classification.alternatives,
            },
        }

    def _load_dummy_nutrition_db(self) -> dict:
        """MVP용 더미 영양 DB."""
        return {
            "된장찌개": NutritionInfo(
                food_name="된장찌개", serving_size="1인분 (300g)",
                calories=150, carbohydrate=12, protein=10, fat=7,
                sodium=2400, sugar=3, fiber=4, cholesterol=15,
            ),
            "김치찌개": NutritionInfo(
                food_name="김치찌개", serving_size="1인분 (300g)",
                calories=200, carbohydrate=10, protein=15, fat=10,
                sodium=2800, sugar=4, fiber=3, cholesterol=30,
            ),
            "샐러드": NutritionInfo(
                food_name="샐러드", serving_size="1인분 (200g)",
                calories=120, carbohydrate=15, protein=5, fat=5,
                sodium=300, sugar=6, fiber=7, cholesterol=0,
            ),
            "비빔밥": NutritionInfo(
                food_name="비빔밥", serving_size="1인분 (400g)",
                calories=550, carbohydrate=80, protein=20, fat=15,
                sodium=1200, sugar=8, fiber=6, cholesterol=50,
            ),
            "청국장": NutritionInfo(
                food_name="청국장", serving_size="1인분 (300g)",
                calories=180, carbohydrate=15, protein=12, fat=8,
                sodium=2600, sugar=2, fiber=5, cholesterol=10,
            ),
            "잡곡밥": NutritionInfo(
                food_name="잡곡밥", serving_size="1공기 (210g)",
                calories=310, carbohydrate=65, protein=7, fat=2,
                sodium=5, sugar=1, fiber=4, cholesterol=0,
            ),
        }
