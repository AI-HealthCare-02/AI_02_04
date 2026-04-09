"""
CRAG-lite Corrector — 검색 결과 품질 검증 및 보정.

왜 이 모듈이 핵심인가:
- 검색 결과가 부실한데 LLM에 넣으면 환각이 발생한다.
- CRAG-lite는 검색 품질을 3등급(CONFIDENT/UNCERTAIN/INSUFFICIENT)으로 판정한다.
- UNCERTAIN이면 Query Rewrite → 재검색 1회.
- INSUFFICIENT이면 LLM 호출 없이 안전한 fallback 메시지를 반환한다.
"""
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class CorrectionResult:
    status: str  # CONFIDENT, CONFIDENT_AFTER_RETRY, REDUCED, INSUFFICIENT
    chunks: list  # 사용할 검색 결과
    confidence: float
    rewritten_query: Optional[str] = None
    caveat: Optional[str] = None
    fallback_message: Optional[str] = None


class CRAGLiteCorrector:
    """
    검색 결과의 품질을 평가하고, 필요 시 보정한다.
    핵심 원칙: '모르면 모른다고 말하는 AI'
    """

    # MVP 더미 모드에서는 키워드 매칭 점수가 낮으므로 임계값을 낮게 설정.
    # Production에서 실제 embedding 사용 시 0.7 / 0.4로 상향 조정.
    CONFIDENT_THRESHOLD = 0.25
    UNCERTAIN_THRESHOLD = 0.10
    MAX_RETRIES = 1

    def __init__(self, retriever, query_rewriter=None):
        self.retriever = retriever
        self.query_rewriter = query_rewriter

    def correct(
        self,
        query: str,
        ranked_chunks: list,
        filters=None,
    ) -> CorrectionResult:
        """
        검색 결과를 평가하고 필요 시 보정한다.

        Flow:
        1. 품질 평가 (CONFIDENT / UNCERTAIN / INSUFFICIENT)
        2. CONFIDENT → 그대로 사용
        3. UNCERTAIN → Query Rewrite → 재검색 1회
        4. INSUFFICIENT → fallback 메시지 반환 (LLM 미호출)
        """
        quality = self._evaluate_quality(ranked_chunks)

        if quality == "CONFIDENT":
            logger.info(
                f"CRAG: CONFIDENT (top1={ranked_chunks[0].score:.2f})"
            )
            return CorrectionResult(
                status="CONFIDENT",
                chunks=ranked_chunks,
                confidence=ranked_chunks[0].score,
            )

        elif quality == "UNCERTAIN":
            logger.info("CRAG: UNCERTAIN — attempting query rewrite")

            # Query Rewrite → 재검색
            rewritten = self._rewrite_query(query)
            new_results = self.retriever.retrieve(
                rewritten, filters=filters, top_k=10
            )

            if new_results:
                new_quality = self._evaluate_quality(new_results)
                if new_quality == "CONFIDENT":
                    logger.info(
                        f"CRAG: CONFIDENT_AFTER_RETRY "
                        f"(top1={new_results[0].score:.2f})"
                    )
                    return CorrectionResult(
                        status="CONFIDENT_AFTER_RETRY",
                        chunks=new_results,
                        confidence=new_results[0].score,
                        rewritten_query=rewritten,
                    )

            # 재검색 후에도 불충분 → 축소 응답
            best_chunks = (
                new_results[:2] if new_results
                else ranked_chunks[:2] if ranked_chunks
                else []
            )
            logger.info("CRAG: REDUCED — using limited evidence")
            return CorrectionResult(
                status="REDUCED",
                chunks=best_chunks,
                confidence=(
                    best_chunks[0].score if best_chunks else 0.0
                ),
                rewritten_query=rewritten,
                caveat="제한된 근거로 응답합니다.",
            )

        else:  # INSUFFICIENT
            logger.warning("CRAG: INSUFFICIENT — fallback activated")
            return CorrectionResult(
                status="INSUFFICIENT",
                chunks=[],
                confidence=0.0,
                fallback_message=(
                    "충분한 근거를 찾지 못했습니다. "
                    "이 부분은 담당 의료진과 상담하시길 권장합니다."
                ),
            )

    def _evaluate_quality(self, chunks: list) -> str:
        """검색 결과의 품질을 3등급으로 평가."""
        if not chunks:
            return "INSUFFICIENT"

        top1_score = chunks[0].score
        top3_scores = [c.score for c in chunks[:3]]
        avg_top3 = sum(top3_scores) / len(top3_scores)

        if (
            top1_score >= self.CONFIDENT_THRESHOLD
            and avg_top3 >= 0.5
        ):
            return "CONFIDENT"
        elif top1_score >= self.UNCERTAIN_THRESHOLD:
            return "UNCERTAIN"
        else:
            return "INSUFFICIENT"

    def _rewrite_query(self, query: str) -> str:
        """
        MVP: 간단한 규칙 기반 쿼리 재작성.
        Production: LLM을 사용한 쿼리 재작성.
        """
        # MVP: 핵심 키워드 추출 + 구체화
        rewrites = {
            "걷기": "고혈압 유산소 운동 걷기 효과 권장량",
            "식단": "고혈압 당뇨 저염식 DASH 식단 나트륨 제한",
            "운동": "고혈압 당뇨 유산소 운동 권장 빈도 시간",
            "혈압": "고혈압 혈압 관리 생활습관 개선 방법",
            "혈당": "당뇨 혈당 관리 식이요법 운동요법",
            "수면": "고혈압 수면 시간 혈압 관계",
            "나트륨": "고혈압 나트륨 섭취 제한 저염식",
            "물": "수분 섭취 권장량 혈압 혈당 관리",
        }

        for keyword, rewritten in rewrites.items():
            if keyword in query:
                return rewritten

        # 기본 전략: 쿼리에 "고혈압 당뇨 생활습관" 추가
        return f"고혈압 당뇨 생활습관 {query}"
