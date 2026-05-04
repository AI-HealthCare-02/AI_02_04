import { test, expect, type Page } from '@playwright/test';

/**
 * 주간 건강 리포트 E2E 테스트 (R-01 ~ R-05)
 *
 * 전제: qa_golden@test.com 계정 (캐릭터 생성 완료)
 *
 * 검증 항목:
 *  R-01 - 리포트 목록 기본 UI (월 네비게이터, 발행된 리포트 목록)
 *  R-02 - 월 이동 (이전 달 클릭 → 월 변경 확인)
 *  R-03 - 리포트 항목 클릭 → 상세 리포트 화면 진입
 *  R-04 - 상세 리포트 UI (점수 히어로, 미션 달성 현황, 식단 분석, AI 브리핑 섹션)
 *  R-05 - 상세 리포트 → 뒤로가기 → 목록 복귀
 */

const FIXED_EMAIL    = 'qa_golden@test.com';
const FIXED_PASSWORD = 'Test1234!';

// ── 헬퍼: 온보딩 건너뛰기 ─────────────────────────────────────────
async function skipOnboarding(page: Page) {
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── 헬퍼: 로그인 → 마이페이지 → 주간 리포트 목록 진입 ────────────
async function loginAndGoReportList(page: Page) {
  const emailInput = page.getByPlaceholder('example@email.com');
  await expect(emailInput).toBeVisible({ timeout: 8000 });
  await emailInput.fill(FIXED_EMAIL);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(FIXED_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });

  // 마이페이지 → 주간 건강 리포트
  await page.getByRole('button', { name: '내 건강' }).click();
  await expect(page.getByText('계정')).toBeVisible({ timeout: 5000 });
  await page.getByText('주간 건강 리포트').click();
  // 리포트 목록 화면 진입 확인
  await expect(page.getByText('AI 분석 리포트 열람')).toBeVisible({ timeout: 5000 });
}

// ── 공통 셋업 ────────────────────────────────────────────────────
async function setup(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await skipOnboarding(page);
  // Rate Limit 방지: 연속 로그인 호출 사이 여유 시간 확보
  await page.waitForTimeout(2000);
  await loginAndGoReportList(page);
}

// ── 헬퍼: 서브 화면에서 뒤로가기 (ScrollHeader nth(0) 건너뜀) ──
async function goBack(page: Page) {
  await page.locator('button:has(svg)').nth(1).click();
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: 병렬 로그인 API 429 방지
// ═══════════════════════════════════════════════════════════════
test.describe.serial('주간 건강 리포트', () => {
  test.setTimeout(60000);

  /* ── R-01: 리포트 목록 기본 UI ── */
  test('R-01: 주간 리포트 목록 기본 UI가 표시된다', async ({ page }) => {
    await setup(page);

    // 헤더
    await expect(page.getByText('주간 건강 리포트').first()).toBeVisible();
    await expect(page.getByText('AI 분석 리포트 열람')).toBeVisible();

    // 월 네비게이터: 현재 연·월 표시 (exact: true 로 날짜 셀과 구분)
    const now = new Date();
    await expect(
      page.getByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`, { exact: true })
    ).toBeVisible({ timeout: 5000 });

    // 로딩 완료 후 리포트 목록 헤더
    await expect(page.getByText('발행된 리포트')).toBeVisible({ timeout: 8000 });

    // 총 N건 텍스트
    await expect(page.getByText(/총 \d+건/)).toBeVisible({ timeout: 8000 });

    // 이번 주 건강 리포트 항목
    await expect(page.getByText('이번 주 건강 리포트')).toBeVisible({ timeout: 8000 });

    // LIVE 뱃지 (현재 주 API 연동 표시)
    await expect(page.getByText('LIVE')).toBeVisible({ timeout: 8000 });

    console.log('✅ R-01 리포트 목록 기본 UI 확인 완료');
  });

  /* ── R-02: 월 이동 ── */
  test('R-02: 이전 달 버튼 클릭 시 월이 변경된다', async ({ page }) => {
    await setup(page);

    // 로딩 완료 대기
    await expect(page.getByText(/총 \d+건/)).toBeVisible({ timeout: 8000 });

    // 현재 월 확인 (exact: true 로 날짜 셀 "2026년 5월 4일" 과 구분)
    const now = new Date();
    const currentMonthText = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    await expect(page.getByText(currentMonthText, { exact: true })).toBeVisible();

    // 월 네비게이터의 ChevronLeft(이전달) 버튼 클릭
    // DOM 순서: ScrollHeader(0), 헤더 뒤로가기(1), ChevronLeft(2), ChevronRight(3)
    await page.locator('button:has(svg)').nth(2).click();
    await page.waitForTimeout(300);

    // 이전 달로 변경 확인 — { exact: true }로 날짜 셀과 구분
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await expect(
      page.getByText(`${prevMonth.getFullYear()}년 ${prevMonth.getMonth() + 1}월`, { exact: true })
    ).toBeVisible({ timeout: 3000 });

    console.log('✅ R-02 월 이동 확인 완료');
  });

  /* ── R-03: 리포트 항목 클릭 → 상세 화면 진입 ── */
  test('R-03: 리포트 항목 클릭 시 상세 리포트 화면으로 이동한다', async ({ page }) => {
    await setup(page);

    // 로딩 완료 대기
    await expect(page.getByText('이번 주 건강 리포트')).toBeVisible({ timeout: 8000 });

    // 첫 번째 리포트(이번 주) 클릭
    await page.getByText('이번 주 건강 리포트').click();

    // 상세 화면: 점수 히어로 "이번 주 건강 점수 N점!" 확인
    await expect(
      page.getByText(/이번 주 건강 점수 \d+점!/)
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ R-03 상세 리포트 화면 진입 확인 완료');
  });

  /* ── R-04: 상세 리포트 UI 섹션 검증 ── */
  test('R-04: 상세 리포트의 주요 섹션(점수·미션·식단·AI 브리핑)이 표시된다', async ({ page }) => {
    await setup(page);
    await expect(page.getByText('이번 주 건강 리포트')).toBeVisible({ timeout: 8000 });
    await page.getByText('이번 주 건강 리포트').click();

    // ① 점수 히어로
    await expect(page.getByText(/이번 주 건강 점수 \d+점!/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('/ 100점')).toBeVisible();

    // 점수 범례 (우수·양호·보통·분발)
    await expect(page.getByText('우수')).toBeVisible();
    await expect(page.getByText('양호')).toBeVisible();
    await expect(page.getByText('보통')).toBeVisible();
    await expect(page.getByText('분발')).toBeVisible();

    // ② 미션 달성 현황 섹션
    await expect(page.getByText('미션 달성 현황')).toBeVisible();
    // 요일별 활동량 (월~일)
    await expect(page.getByText('월').first()).toBeVisible();
    await expect(page.getByText('일').first()).toBeVisible();

    // ③ 식단 & 영양 분석 섹션
    await expect(page.getByText('주간 식단 & 영양 분석')).toBeVisible();
    await expect(page.getByText('탄수화물').first()).toBeVisible();
    await expect(page.getByText('단백질').first()).toBeVisible();
    await expect(page.getByText('지방').first()).toBeVisible();
    await expect(page.getByText('이번 주 자주 먹은 음식')).toBeVisible();

    // ④ AI 주간 브리핑 섹션
    await expect(page.getByText('AI 주간 브리핑')).toBeVisible();
    await expect(page.getByText('정말 잘하셨어요!')).toBeVisible();
    await expect(page.getByText('조금 아쉬워요')).toBeVisible();
    await expect(page.getByText('다음 주 전략 제안')).toBeVisible();

    console.log('✅ R-04 상세 리포트 섹션 확인 완료');
  });

  /* ── R-05: 상세 리포트 → 뒤로가기 → 목록 복귀 ── */
  test('R-05: 상세 리포트에서 뒤로가기 클릭 시 리포트 목록으로 돌아간다', async ({ page }) => {
    await setup(page);
    await expect(page.getByText('이번 주 건강 리포트')).toBeVisible({ timeout: 8000 });
    await page.getByText('이번 주 건강 리포트').click();

    // 상세 화면 진입 확인
    await expect(page.getByText(/이번 주 건강 점수 \d+점!/)).toBeVisible({ timeout: 10000 });

    // 뒤로가기 클릭
    await goBack(page);

    // 리포트 목록 복귀 확인
    await expect(page.getByText('AI 분석 리포트 열람')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('이번 주 건강 리포트')).toBeVisible();

    console.log('✅ R-05 리포트 목록 복귀 확인 완료');
  });

});
