"""
RAG Retriever — Hybrid Retrieval (Dense + BM25 + RRF Fusion).

왜 Hybrid인가:
- Dense-only는 전문 용어(amlodipine, 나트륨 등) 매칭에 약하다.
- BM25-only는 의미적 유사성(소금 ≈ 나트륨)을 놓친다.
- 둘을 결합하면 두 장점을 모두 확보한다.

MVP: 더미 데이터로 동작. 실제 배포 시 벡터DB(Chroma/Qdrant) + BM25 인덱스로 교체.
"""
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ChunkMetadata:
    chunk_id: str
    doc_id: str
    source: str
    category: str           # lifestyle_diet, lifestyle_exercise, ...
    condition: list[str]    # ["hypertension", "diabetes", "both"]
    evidence_level: str     # A, B, C, D
    section_title: str = ""
    page_number: int = 0


@dataclass
class ScoredChunk:
    text: str
    metadata: ChunkMetadata
    score: float
    retrieval_method: str = "hybrid"  # dense, sparse, hybrid


@dataclass
class MetadataFilter:
    conditions: Optional[list[str]] = None
    categories: Optional[list[str]] = None
    evidence_levels: Optional[list[str]] = None


class HybridRetriever:
    """
    Dense + Sparse 병렬 검색 후 RRF(Reciprocal Rank Fusion)로 결합.
    MVP에서는 더미 knowledge base를 사용하고,
    실제 배포 시 벡터DB + BM25 인덱스로 교체한다.
    """

    def __init__(self):
        # MVP: 더미 knowledge base
        self._knowledge_base = self._load_dummy_knowledge()

    def retrieve(
        self,
        query: str,
        filters: Optional[MetadataFilter] = None,
        top_k: int = 20,
    ) -> list[ScoredChunk]:
        """
        Hybrid Retrieval을 실행한다.
        MVP: 키워드 매칭 기반 더미 검색
        Production: Dense(벡터) + Sparse(BM25) + RRF 결합
        """
        results = []

        for chunk in self._knowledge_base:
            # 필터 적용
            if filters and not self._passes_filter(chunk, filters):
                continue

            # MVP: 단순 키워드 매칭으로 유사도 시뮬레이션
            score = self._dummy_relevance_score(query, chunk)
            if score > 0.1:
                results.append(
                    ScoredChunk(
                        text=chunk["text"],
                        metadata=ChunkMetadata(**chunk["metadata"]),
                        score=score,
                    )
                )

        # 점수순 정렬 후 top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _passes_filter(self, chunk: dict, filters: MetadataFilter) -> bool:
        """메타데이터 필터 적용."""
        meta = chunk["metadata"]

        if filters.conditions:
            if not any(c in meta["condition"] for c in filters.conditions):
                return False

        if filters.categories:
            if meta["category"] not in filters.categories:
                return False

        if filters.evidence_levels:
            if meta["evidence_level"] not in filters.evidence_levels:
                return False

        return True

    def _dummy_relevance_score(self, query: str, chunk: dict) -> float:
        """MVP용 간단한 키워드 매칭 점수."""
        query_lower = query.lower()
        text_lower = chunk["text"].lower()
        title_lower = chunk["metadata"].get("section_title", "").lower()

        # 키워드 단위 매칭
        query_tokens = set(query_lower.split())
        text_tokens = set(text_lower.split())
        title_tokens = set(title_lower.split())

        text_overlap = len(query_tokens & text_tokens)
        title_overlap = len(query_tokens & title_tokens) * 2

        # 부분 문자열 매칭 (한국어 특성 반영)
        substr_score = 0
        for token in query_tokens:
            if len(token) >= 2:
                if token in text_lower:
                    substr_score += 1
                if token in title_lower:
                    substr_score += 2

        total = text_overlap + title_overlap + substr_score
        max_possible = max(len(query_tokens) * 3, 1)
        return min(total / max_possible, 1.0)

    def _load_dummy_knowledge(self) -> list[dict]:
        """
        MVP용 더미 건강 정보 Knowledge Base.
        실제 배포 시 진료지침, 생활습관 가이드 등의 실제 문서로 교체.
        """
        return [
            {
                "text": (
                    "고혈압 환자의 나트륨 섭취는 하루 2,000mg 이하로 제한하는 것이 권장된다. "
                    "저염식은 수축기 혈압을 평균 2~8mmHg 낮출 수 있다. "
                    "가공식품, 국물 요리, 젓갈류의 섭취를 줄이는 것이 효과적이다."
                ),
                "metadata": {
                    "chunk_id": "hyp_diet_001",
                    "doc_id": "hyp_guide_2023",
                    "source": "대한고혈압학회 진료지침 2023",
                    "category": "lifestyle_diet",
                    "condition": ["hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "식사요법 - 나트륨 제한",
                    "page_number": 42,
                },
            },
            {
                "text": (
                    "규칙적인 유산소 운동은 수축기 혈압을 5~8mmHg 감소시킬 수 있다. "
                    "주 5회, 1회 30분 이상의 중등도 유산소 운동이 권장된다. "
                    "빠르게 걷기, 자전거 타기, 수영이 적합한 운동이다."
                ),
                "metadata": {
                    "chunk_id": "hyp_exercise_001",
                    "doc_id": "hyp_guide_2023",
                    "source": "대한고혈압학회 진료지침 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "운동요법",
                    "page_number": 48,
                },
            },
            {
                "text": (
                    "당뇨병 전단계에서 체중의 5~7% 감량은 당뇨병 발생을 58% 감소시킨다. "
                    "식이섬유가 풍부한 식단과 규칙적인 식사가 혈당 관리에 효과적이다. "
                    "정제된 탄수화물과 단순당의 섭취를 줄이는 것이 중요하다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "식사요법 - 체중 관리",
                    "page_number": 35,
                },
            },
            {
                "text": (
                    "식후 30분 이내의 가벼운 걷기(10~15분)는 식후 혈당 상승을 "
                    "효과적으로 억제할 수 있다. 특히 저녁 식사 후 걷기가 "
                    "공복 혈당 개선에 도움이 된다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "운동요법 - 식후 걷기",
                    "page_number": 52,
                },
            },
            {
                "text": (
                    "수면 시간이 6시간 미만이면 고혈압 위험이 증가한다. "
                    "7~8시간의 충분한 수면과 규칙적인 수면 패턴이 "
                    "혈압 관리에 도움이 된다."
                ),
                "metadata": {
                    "chunk_id": "hyp_sleep_001",
                    "doc_id": "hyp_guide_2023",
                    "source": "대한고혈압학회 진료지침 2023",
                    "category": "lifestyle_sleep",
                    "condition": ["hypertension", "both"],
                    "evidence_level": "B",
                    "section_title": "수면과 혈압",
                    "page_number": 55,
                },
            },
            {
                "text": (
                    "가정혈압 측정 시 아침 기상 후 1시간 이내, 소변을 본 후, "
                    "아침 식사 전, 약 복용 전에 측정하는 것이 가장 정확하다. "
                    "2회 측정하여 평균값을 기록하는 것을 권장한다."
                ),
                "metadata": {
                    "chunk_id": "measure_bp_001",
                    "doc_id": "measure_guide_2023",
                    "source": "대한고혈압학회 가정혈압 측정 가이드",
                    "category": "measurement_guide",
                    "condition": ["hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "가정혈압 측정 방법",
                    "page_number": 8,
                },
            },
            {
                "text": (
                    "DASH 식단(Dietary Approaches to Stop Hypertension)은 "
                    "과일, 채소, 저지방 유제품을 풍부하게 섭취하고 "
                    "포화지방과 콜레스테롤을 줄이는 식단이다. "
                    "수축기 혈압을 8~14mmHg 감소시킬 수 있다."
                ),
                "metadata": {
                    "chunk_id": "hyp_diet_002",
                    "doc_id": "hyp_guide_2023",
                    "source": "대한고혈압학회 진료지침 2023",
                    "category": "lifestyle_diet",
                    "condition": ["hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "식사요법 - DASH 식단",
                    "page_number": 44,
                },
            },
            {
                "text": (
                    "물을 하루 1.5~2L 이상 충분히 섭취하면 혈액 순환 개선과 "
                    "신장 기능 유지에 도움이 된다. 카페인 음료보다 "
                    "물이나 보리차를 선택하는 것이 좋다."
                ),
                "metadata": {
                    "chunk_id": "general_water_001",
                    "doc_id": "lifestyle_guide_2023",
                    "source": "건강보험공단 건강생활 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["hypertension", "diabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "수분 섭취",
                    "page_number": 22,
                },
            },
            # ── 당뇨 관련 추가 chunk (20개) ──
            {
                "text": (
                    "당뇨병 환자의 탄수화물 섭취는 전체 열량의 50~60%로 조절하되, "
                    "GI(혈당지수)가 낮은 식품을 선택하는 것이 중요하다. "
                    "흰쌀밥 대신 잡곡밥, 현미밥을 권장한다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_002",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "식사요법 - 탄수화물 관리",
                    "page_number": 37,
                },
            },
            {
                "text": (
                    "제2형 당뇨병 환자에서 주 150분 이상의 중등도 유산소 운동은 "
                    "당화혈색소(HbA1c)를 0.5~0.7% 감소시킨다. "
                    "운동은 연속 2일 이상 쉬지 않도록 분배하는 것이 좋다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_002",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "운동요법 - 유산소 운동",
                    "page_number": 54,
                },
            },
            {
                "text": (
                    "저항성 운동(근력 운동)은 인슐린 감수성을 개선하고 "
                    "근육량 유지에 도움이 된다. 주 2~3회 주요 근육군을 "
                    "포함한 저항성 운동을 유산소 운동과 병행하는 것을 권장한다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_003",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "운동요법 - 저항성 운동",
                    "page_number": 56,
                },
            },
            {
                "text": (
                    "공복혈당 100~125mg/dL은 공복혈당장애, "
                    "식후 2시간 혈당 140~199mg/dL은 내당능장애로 분류된다. "
                    "두 경우 모두 당뇨 전단계로 생활습관 교정이 우선이다."
                ),
                "metadata": {
                    "chunk_id": "dm_diagnosis_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "medical_reference",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "당뇨 전단계 진단 기준",
                    "page_number": 12,
                },
            },
            {
                "text": (
                    "식이섬유는 혈당 상승 속도를 늦추고 포만감을 준다. "
                    "하루 25~30g의 식이섬유 섭취를 권장하며, "
                    "채소, 해조류, 통곡물이 좋은 공급원이다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_003",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "식사요법 - 식이섬유",
                    "page_number": 39,
                },
            },
            {
                "text": (
                    "당뇨병 환자의 음주는 저혈당 위험을 증가시킨다. "
                    "음주 시 반드시 음식과 함께 섭취하고, "
                    "남성 2잔, 여성 1잔 이내로 제한하는 것을 권장한다."
                ),
                "metadata": {
                    "chunk_id": "dm_alcohol_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "음주와 혈당 관리",
                    "page_number": 41,
                },
            },
            {
                "text": (
                    "스트레스는 코르티솔 분비를 증가시켜 혈당을 높인다. "
                    "심호흡, 명상, 가벼운 산책 등의 스트레스 관리가 "
                    "혈당 조절에 간접적으로 도움이 된다."
                ),
                "metadata": {
                    "chunk_id": "dm_stress_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_stress",
                    "condition": ["diabetes", "hypertension", "both"],
                    "evidence_level": "B",
                    "section_title": "스트레스와 혈당",
                    "page_number": 62,
                },
            },
            {
                "text": (
                    "수면 부족(6시간 미만)은 인슐린 저항성을 악화시키고 "
                    "식욕 호르몬 불균형을 유발한다. "
                    "당뇨 위험군은 7~9시간의 규칙적인 수면이 중요하다."
                ),
                "metadata": {
                    "chunk_id": "dm_sleep_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_sleep",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "수면과 혈당 관리",
                    "page_number": 64,
                },
            },
            {
                "text": (
                    "자가혈당측정(SMBG)은 식전, 식후 2시간에 측정하는 것이 기본이다. "
                    "식후 혈당 목표는 180mg/dL 미만이며, "
                    "측정 결과를 기록하여 패턴을 파악하는 것이 중요하다."
                ),
                "metadata": {
                    "chunk_id": "dm_measure_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "measurement_guide",
                    "condition": ["diabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "자가혈당측정",
                    "page_number": 28,
                },
            },
            {
                "text": (
                    "당뇨병 환자의 단백질 섭취는 전체 열량의 15~20%를 권장한다. "
                    "식물성 단백질(두부, 콩)과 저지방 동물성 단백질(닭가슴살, 생선)을 "
                    "골고루 섭취하는 것이 좋다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_004",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "식사요법 - 단백질 섭취",
                    "page_number": 40,
                },
            },
            {
                "text": (
                    "BMI 25 이상인 당뇨 전단계 환자는 체중을 5~7% 감량하면 "
                    "당뇨 발생 위험을 58% 줄일 수 있다. "
                    "급격한 감량보다 월 1~2kg의 점진적 감량이 효과적이다."
                ),
                "metadata": {
                    "chunk_id": "dm_weight_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "체중 관리",
                    "page_number": 36,
                },
            },
            {
                "text": (
                    "야식은 취침 전 혈당을 높이고 수면의 질을 떨어뜨린다. "
                    "저녁 식사 후 최소 3시간은 공복을 유지하고, "
                    "야간 공복이 어려우면 채소 스틱이나 견과류 소량으로 대체한다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_005",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "C",
                    "section_title": "야식과 혈당",
                    "page_number": 43,
                },
            },
            {
                "text": (
                    "흡연은 인슐린 저항성을 악화시키고 심혈관 합병증 위험을 높인다. "
                    "당뇨병 환자의 금연은 혈당 조절뿐 아니라 "
                    "심혈관 질환 예방을 위해서도 필수적이다."
                ),
                "metadata": {
                    "chunk_id": "dm_smoking_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_smoking",
                    "condition": ["diabetes", "hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "금연",
                    "page_number": 58,
                },
            },
            {
                "text": (
                    "나트륨 과다 섭취는 혈압 상승뿐 아니라 인슐린 저항성도 악화시킨다. "
                    "국물 음식의 국물은 반만 섭취하고, "
                    "소금 대신 레몬즙, 식초, 허브를 활용하면 나트륨을 줄일 수 있다."
                ),
                "metadata": {
                    "chunk_id": "dm_sodium_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "hypertension", "both"],
                    "evidence_level": "B",
                    "section_title": "나트륨과 당뇨",
                    "page_number": 42,
                },
            },
            {
                "text": (
                    "1형 당뇨병 환자는 운동 전 혈당이 70mg/dL 미만이면 "
                    "운동을 시작하지 않아야 하며, 운동 전 탄수화물 보충이 필요하다. "
                    "저혈당 대비 포도당 사탕을 항상 소지해야 한다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_004",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "1형 당뇨와 운동 안전",
                    "page_number": 57,
                },
            },
            {
                "text": (
                    "당뇨병 환자가 규칙적으로 식사하면 혈당 변동폭이 줄어든다. "
                    "하루 3끼를 일정한 시간에 먹고, "
                    "끼니 사이 간격은 4~6시간을 유지하는 것이 좋다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_006",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "규칙적 식사",
                    "page_number": 38,
                },
            },
            {
                "text": (
                    "하체 근력 운동(스쿼트, 런지 등)은 체내 가장 큰 근육군을 자극하여 "
                    "포도당 소비를 증가시키고 인슐린 감수성을 높인다. "
                    "주 2회 이상 하체 운동을 포함하는 것을 권장한다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_005",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "하체 근력 운동",
                    "page_number": 55,
                },
            },
            {
                "text": (
                    "과일은 비타민과 식이섬유가 풍부하지만 과당이 포함되어 있다. "
                    "하루 1~2회, 주먹 크기 1개 분량으로 제한하고, "
                    "주스보다 생과일을 통째로 먹는 것이 혈당 관리에 유리하다."
                ),
                "metadata": {
                    "chunk_id": "dm_diet_007",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_diet",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "B",
                    "section_title": "과일 섭취 가이드",
                    "page_number": 44,
                },
            },
            {
                "text": (
                    "고혈압과 당뇨가 동반된 환자는 심혈관 질환 위험이 4배 증가한다. "
                    "혈압 목표를 130/80mmHg 미만으로 유지하고, "
                    "저염식 + 규칙적 운동을 반드시 병행해야 한다."
                ),
                "metadata": {
                    "chunk_id": "comorbid_001",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 진료지침 2023",
                    "category": "medical_reference",
                    "condition": ["diabetes", "hypertension", "both"],
                    "evidence_level": "A",
                    "section_title": "고혈압-당뇨 동반 관리",
                    "page_number": 68,
                },
            },
            {
                "text": (
                    "걷기는 가장 안전하고 효과적인 당뇨 관리 운동이다. "
                    "식후 15~30분 걷기는 혈당 상승을 30~50% 억제할 수 있다. "
                    "하루 7000~8000보를 목표로 하되, 무리하지 않고 점진적으로 늘린다."
                ),
                "metadata": {
                    "chunk_id": "dm_exercise_006",
                    "doc_id": "dm_guide_2023",
                    "source": "대한당뇨병학회 생활습관 가이드 2023",
                    "category": "lifestyle_exercise",
                    "condition": ["diabetes", "prediabetes", "both"],
                    "evidence_level": "A",
                    "section_title": "걷기 운동",
                    "page_number": 53,
                },
            },
        ]


