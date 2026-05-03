import { test, expect, type Page } from '@playwright/test';

/**
 * 식단 화면 E2E 테스트 (D-01 ~ D-05)
 *
 * 음식명 직접 입력 흐름은 mock(setTimeout 1.5s)으로 처리되어
 * 백엔드 없이도 분석 결과 확인 가능.
 *
 * 검증 항목:
 *  D-01 - 식단 화면 기본 UI (오늘의 영양 섭취, 칼로리·탄수·단백·지방, 끼니 탭)
 *  D-02 - 끼니 탭 전환 (아침 → 점심 → 저녁 → 간식)
 *  D-03 - "음식명 직접 입력하기" 모달 오픈 및 입력 확인
 *  D-04 - "AI 분석하기" 클릭 → mock 분석 완료 → 영양소 결과 표시
 *  D-05 - "저장하기" 클릭 → 오늘의 칼로리 합산 + "저장 완료" 토스트
 */

const FIXED_EMAIL    = 'qa_golden@test.com';
const FIXED_PASSWORD = 'Test1234!';

// ── 헬퍼: 온보딩 건너뛰기 ────────────────────────────────────────
async function skipOnboarding(page: Page) {
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── 헬퍼: 로그인 → 홈 → 식단 화면 진입 ──────────────────────────
async function loginAndGoDiet(page: Page) {
  const emailInput = page.getByPlaceholder('example@email.com');
  await expect(emailInput).toBeVisible({ timeout: 8000 });
  await emailInput.fill(FIXED_EMAIL);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(FIXED_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '식단' }).click();
  await expect(page.getByText('오늘의 영양 섭취')).toBeVisible({ timeout: 5000 });
}

// ── 공통 셋업 ──────────────────────────────────────────────────
async function setup(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await skipOnboarding(page);
  await loginAndGoDiet(page);
}

// ── 헬퍼: 음식명 직접 입력 → AI 분석 → 분석 완료 대기 ───────────
async function enterFoodAndAnalyze(page: Page, foodName: string) {
  // "음식명 직접 입력하기" 버튼 클릭 → 모달 오픈
  await page.getByRole('button', { name: /음식명 직접 입력하기/ })
    .or(page.getByText('음식명 직접 입력하기')).first().click();

  // 모달 확인
  await expect(page.getByText('음식 직접 입력')).toBeVisible({ timeout: 3000 });
  await page.getByPlaceholder('예: 닭가슴살 샐러드 1인분').fill(foodName);
  await page.getByRole('button', { name: 'AI 분석하기' }).click();

  // mock 분석 1.5초 후 complete 상태 대기 (음식명이 헤더에 표시됨 + 저장하기 버튼 활성화)
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible({ timeout: 5000 });
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: 병렬 로그인 API 429 방지
// ═══════════════════════════════════════════════════════════════
test.describe.serial('식단 화면', () => {
  test.setTimeout(60000);

  /* ── D-01: 식단 화면 기본 UI ── */
  test('D-01: 식단 화면 기본 UI 요소가 표시된다', async ({ page }) => {
    await setup(page);

    // 오늘의 영양 섭취 카드
    await expect(page.getByText('오늘의 영양 섭취')).toBeVisible();

    // 칼로리 표시 (N / M kcal 형식)
    await expect(page.getByText(/kcal/i).first()).toBeVisible();

    // 영양소 라벨
    await expect(page.getByText('탄수화물').first()).toBeVisible();
    await expect(page.getByText('단백질').first()).toBeVisible();
    await expect(page.getByText('지방').first()).toBeVisible();

    // 끼니 탭 4개
    await expect(page.getByRole('button', { name: '아침' })).toBeVisible();
    await expect(page.getByRole('button', { name: '점심' })).toBeVisible();
    await expect(page.getByRole('button', { name: '저녁' })).toBeVisible();
    await expect(page.getByRole('button', { name: '간식' })).toBeVisible();

    // 업로드 영역
    await expect(page.getByRole('button', { name: /촬영하기/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /앨범에서/ })).toBeVisible();
    await expect(page.getByText('음식명 직접 입력하기')).toBeVisible();

    console.log('✅ D-01 식단 화면 기본 UI 확인 완료');
  });

  /* ── D-02: 끼니 탭 전환 ── */
  test('D-02: 끼니 탭(아침·점심·저녁·간식)을 클릭하면 해당 탭이 활성화된다', async ({ page }) => {
    await setup(page);

    const meals = ['아침', '점심', '저녁', '간식'] as const;

    for (const meal of meals) {
      await page.getByRole('button', { name: meal }).click();
      await page.waitForTimeout(200);

      // 활성 탭: 사진 업로드 영역 헤더가 해당 끼니 이름 포함
      await expect(page.getByText(`${meal} 사진 업로드`)).toBeVisible({ timeout: 3000 });
    }

    console.log('✅ D-02 끼니 탭 전환 확인 완료');
  });

  /* ── D-03: 음식명 직접 입력 모달 ── */
  test('D-03: "음식명 직접 입력하기" 클릭 시 입력 모달이 열린다', async ({ page }) => {
    await setup(page);

    // 모달 오픈
    await page.getByText('음식명 직접 입력하기').click();

    // 모달 내용 확인
    await expect(page.getByText('음식 직접 입력')).toBeVisible({ timeout: 3000 });
    await expect(page.getByPlaceholder('예: 닭가슴살 샐러드 1인분')).toBeVisible();
    await expect(page.getByRole('button', { name: 'AI 분석하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();

    // 음식명 입력
    await page.getByPlaceholder('예: 닭가슴살 샐러드 1인분').fill('현미밥 1공기');
    await expect(page.getByPlaceholder('예: 닭가슴살 샐러드 1인분')).toHaveValue('현미밥 1공기');

    // 취소 → 모달 닫힘 확인
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByText('음식 직접 입력')).not.toBeVisible({ timeout: 2000 });

    console.log('✅ D-03 음식 직접 입력 모달 확인 완료');
  });

  /* ── D-04: AI 분석 결과 표시 ── */
  test('D-04: 음식명 입력 후 AI 분석하기 클릭 시 영양소 분석 결과가 표시된다', async ({ page }) => {
    await setup(page);

    await enterFoodAndAnalyze(page, '닭가슴살 샐러드');

    // mock 결과: 350 kcal, 탄수 45g, 단백질 20g, 지방 10g
    await expect(page.getByText('350').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('45').first()).toBeVisible();
    await expect(page.getByText('20').first()).toBeVisible();
    await expect(page.getByText('10').first()).toBeVisible();

    // 음식 이름 표시
    await expect(page.getByText('닭가슴살 샐러드')).toBeVisible();

    // "저장하기" 버튼 활성화 확인
    await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible();

    console.log('✅ D-04 AI 분석 결과 표시 확인 완료');
  });

  /* ── D-05: 식단 저장 후 칼로리 합산 ── */
  test('D-05: "저장하기" 클릭 시 오늘의 칼로리가 합산되고 저장 완료 토스트가 뜬다', async ({ page }) => {
    await setup(page);

    // 저장 전 칼로리: 0 kcal (신규 세션)
    const caloriePattern = /^0$/;
    // "0 / N kcal" 형태에서 첫 숫자 0 확인
    await expect(page.locator('text=/^0$/').first()).toBeVisible({ timeout: 3000 });

    // 음식 분석 실행
    await enterFoodAndAnalyze(page, '비빔밥 1인분');

    // 저장하기 클릭
    await page.getByRole('button', { name: '저장하기' }).click();
    await page.waitForTimeout(300);

    // "저장 완료" 토스트 확인
    await expect(page.getByText('저장 완료').first()).toBeVisible({ timeout: 5000 });

    // 칼로리 합산: 350 kcal 증가
    await expect(page.getByText('350').first()).toBeVisible({ timeout: 3000 });

    // 분석 영역이 idle 상태로 돌아왔는지 확인 (업로드 영역 복원)
    await expect(page.getByText('음식명 직접 입력하기')).toBeVisible({ timeout: 3000 });

    console.log('✅ D-05 식단 저장 및 칼로리 합산 확인 완료');
  });

});
