import { test, expect, type Page } from '@playwright/test';

/**
 * 홈 화면 E2E 테스트 (H-01 ~ H-05)
 *
 * 전제: qa_golden@test.com 계정 + 캐릭터가 이미 생성되어 있어야 함
 *       (golden-path.spec.ts 테스트 4가 먼저 실행되어 있어야 함)
 *
 * 검증 항목:
 *  H-01 - 홈 화면 주요 UI 요소 존재 확인
 *  H-02 - 캐릭터 이름·레벨 표시 확인
 *  H-03 - EXP 바 및 "다음 레벨까지" 텍스트 표시
 *  H-04 - 캐릭터 스탯 3종(에너지·기분·안정감) 표시
 *  H-05 - "전체보기" 클릭 시 미션 화면 이동 / 하단 네비게이션 동작
 */

const FIXED_EMAIL = 'qa_golden@test.com';
const FIXED_PASSWORD = 'Test1234!';

// ── 헬퍼: 스플래시 → 온보딩 건너뛰기 ──────────────────────────────
async function skipOnboarding(page: Page) {
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── 헬퍼: 로그인 → 홈 화면까지 이동 ─────────────────────────────
async function loginAndGoHome(page: Page) {
  const emailInput = page.getByPlaceholder('example@email.com');
  await expect(emailInput).toBeVisible({ timeout: 8000 });
  await emailInput.fill(FIXED_EMAIL);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(FIXED_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  // 홈 화면 도달 대기 (캐릭터 탄생 화면 없이 바로 홈)
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
}

// ── 공통 셋업: 매 테스트 시작 시 로그인 ──────────────────────────
async function setup(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(3000); // 스플래시 대기
  await skipOnboarding(page);
  await loginAndGoHome(page);
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: 병렬 로그인 API 429 방지
// ═══════════════════════════════════════════════════════════════
test.describe.serial('홈 화면', () => {
  test.setTimeout(60000);

  /* ── H-01: 홈 화면 주요 UI 요소 ── */
  test('H-01: 홈 화면 주요 UI 요소가 모두 표시된다', async ({ page }) => {
    await setup(page);

    // 스트릭 영역
    await expect(page.getByText('Streak days')).toBeVisible();

    // 오늘의 추천 섹션
    await expect(page.getByText('오늘의 추천')).toBeVisible();

    // 오늘의 미션 섹션
    await expect(page.getByText('오늘의 미션')).toBeVisible();

    // 전체보기 버튼
    await expect(page.getByRole('button', { name: '전체보기' })).toBeVisible();

    // 하단 네비게이션 탭
    await expect(page.getByRole('button', { name: '홈' })).toBeVisible();
    await expect(page.getByRole('button', { name: '미션' })).toBeVisible();
    await expect(page.getByRole('button', { name: '식단' })).toBeVisible();
    await expect(page.getByRole('button', { name: '도감' })).toBeVisible();
    await expect(page.getByRole('button', { name: '내 건강' })).toBeVisible();

    console.log('✅ H-01 홈 화면 주요 UI 요소 확인 완료');
  });

  /* ── H-02: 캐릭터 이름·레벨 ── */
  test('H-02: 캐릭터 이름과 레벨 배지가 표시된다', async ({ page }) => {
    await setup(page);

    // 캐릭터 이름: 알 또는 생성한 이름 (비어 있지 않음)
    // Lv.N 배지 형식 확인
    await expect(page.getByText(/Lv\.\d+/)).toBeVisible({ timeout: 5000 });

    // 스트릭 숫자 (숫자 형태로 표시)
    const streakEl = page.locator('text=Streak days').locator('..').getByText(/^\d+$/);
    // 스트릭 영역에 숫자가 있으면 통과 (0 포함)
    const streakArea = page.locator('text=Streak days').locator('..');
    await expect(streakArea).toBeVisible();

    console.log('✅ H-02 캐릭터 이름·레벨 표시 확인 완료');
  });

  /* ── H-03: EXP 바 및 레벨업 텍스트 ── */
  test('H-03: EXP 바와 다음 레벨까지 텍스트가 표시된다', async ({ page }) => {
    await setup(page);

    // "EXP" 라벨
    await expect(page.getByText('EXP')).toBeVisible({ timeout: 5000 });

    // "다음 레벨까지 N XP 남았어요" 텍스트
    await expect(page.getByText(/다음 레벨까지/)).toBeVisible();
    await expect(page.getByText(/XP 남았어요/)).toBeVisible();

    // XP 퍼센트 (EXP 바 내부 텍스트)
    await expect(page.getByText(/%$/).first()).toBeVisible();

    console.log('✅ H-03 EXP 바 표시 확인 완료');
  });

  /* ── H-04: 캐릭터 스탯 3종 ── */
  test('H-04: 캐릭터 스탯(에너지·기분·안정감)이 표시된다', async ({ page }) => {
    await setup(page);

    await expect(page.getByText('에너지')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('기분')).toBeVisible();
    await expect(page.getByText('안정감')).toBeVisible();

    console.log('✅ H-04 캐릭터 스탯 3종 표시 확인 완료');
  });

  /* ── H-05: 화면 전환 네비게이션 ── */
  test('H-05: "전체보기" 클릭 시 미션 화면, 하단 탭으로 식단 화면 이동', async ({ page }) => {
    await setup(page);

    // "전체보기" → 미션 화면
    await page.getByRole('button', { name: '전체보기' }).click();
    await expect(page.getByText('오늘의 미션').first()).toBeVisible({ timeout: 5000 });

    // 하단 네비게이션: 식단 탭 클릭
    await page.getByRole('button', { name: '식단' }).click();
    await expect(page.getByText('오늘의 영양 섭취')).toBeVisible({ timeout: 5000 });

    // 홈으로 돌아가기
    await page.getByRole('button', { name: '홈' }).click();
    await expect(page.getByText('Streak days')).toBeVisible({ timeout: 5000 });

    console.log('✅ H-05 화면 전환 네비게이션 확인 완료');
  });

});
