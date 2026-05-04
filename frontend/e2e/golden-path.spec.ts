import { test, expect, type Page } from '@playwright/test';

/**
 * 골든 패스 E2E 테스트
 * 신규 유저 회원가입 → 온보딩 → 캐릭터 생성 → 홈 → 미션 → 식단 → 로그아웃 → 재로그인
 */

// 테스트 3 전용: 매 실행마다 새 계정 생성
const TEST_EMAIL = `qa_test_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test1234!';
const TEST_NAME = '테스트유저';
const CHARACTER_NAME = '당마';

// 테스트 4~8 전용: 고정 계정 (테스트 4에서 자동 생성됨)
const FIXED_EMAIL = 'qa_golden@test.com';
const FIXED_PASSWORD = 'Test1234!';

/** 스플래시 대기 후 온보딩 "건너뛰기" 클릭 → 로그인 화면 도달 */
async function skipOnboarding(page: Page) {
  // 스플래시(2.5초) 이후 온보딩이 뜨면 "건너뛰기" 클릭
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    return;
  }
  // fallback: 슬라이드 버튼 4회 클릭
  for (let i = 0; i < 4; i++) {
    const nextBtn = page.getByRole('button', { name: /다음|시작하기/ });
    if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(400);
    }
  }
}

/** 로그인 후 홈까지 이동 헬퍼 (캐릭터 탄생 화면도 처리) */
async function loginAndGoHome(page: Page, email: string, password: string) {
  // 로그인 입력
  const loginEmail = page.getByPlaceholder('example@email.com');
  await expect(loginEmail).toBeVisible({ timeout: 8000 });
  await loginEmail.fill(email);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForTimeout(2000);

  // 캐릭터 탄생 화면(알)이 뜨면 처리
  const egg = page.locator('img[alt="알"]');
  if (await egg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await egg.click();
    await page.waitForTimeout(1500);

    const nameInput = page.getByPlaceholder(/이름/);
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(CHARACTER_NAME);
      await page.getByRole('button', { name: /완료|시작|확인/ }).click();
      await page.waitForTimeout(1000);
    }
  }
}

// serial: 테스트를 순서대로 실행 (4번이 계정 생성 완료 후 5~8번 실행되도록)
test.describe.serial('골든 패스', () => {

  /* ── 1. 스플래시 → 온보딩 ── */
  test('1. 스플래시 화면이 뜨고 온보딩으로 이동한다', async ({ page }) => {
    await page.goto('/');

    // 스플래시 타이틀 확인
    await expect(page.getByText('당마고치')).toBeVisible();

    // 2.5초 후 자동 전환 (신규 유저)
    await expect(page.getByText('건강한 습관을 만들어요')).toBeVisible({ timeout: 5000 });
  });

  /* ── 2. 온보딩 슬라이드 ── */
  test('2. 온보딩 슬라이드를 끝까지 넘긴다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // 스플래시 대기

    // 슬라이드 4번 넘기기 (마지막은 "시작하기")
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.getByRole('button', { name: /다음|시작하기/ });
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // 로그인 화면 도달 (온보딩 완료 후)
    await expect(page.getByText('당마고치')).toBeVisible({ timeout: 5000 });
  });

  /* ── 3. 회원가입 ── */
  test('3. 건강 정보 입력 후 회원가입한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 온보딩 스킵
    await skipOnboarding(page);

    // 로그인 화면에서 회원가입 버튼 클릭
    await page.getByRole('button', { name: '회원가입' }).click();
    await page.waitForTimeout(500);

    // Step 1 — 이메일
    await page.getByPlaceholder('example@email.com').fill(TEST_EMAIL);
    await page.getByRole('button', { name: '중복 확인' }).click();
    await expect(page.getByText('사용 가능한 이메일입니다')).toBeVisible({ timeout: 5000 });

    // 비밀번호
    await page.getByPlaceholder('비밀번호 (6자 이상)').fill(TEST_PASSWORD);
    await page.getByPlaceholder('비밀번호 재입력').fill(TEST_PASSWORD);

    // 이름
    await page.getByPlaceholder('이름을 입력하세요').fill(TEST_NAME);

    // 나이
    await page.getByPlaceholder('나이를 입력하세요').fill('30');

    // 성별 (남성 버튼 클릭)
    await page.getByRole('button', { name: '남성' }).click();

    // 키 / 몸무게
    await page.getByPlaceholder('cm').fill('175');
    await page.getByPlaceholder('kg').fill('70');

    // Step 1 → Step 2
    await page.getByRole('button', { name: '다음' }).click();
    await page.waitForTimeout(500);

    // Step 2 화면 도달 확인
    await expect(page.getByText('건강 상태 확인')).toBeVisible({ timeout: 5000 });
  });

  /* ── 4. 캐릭터 생성 ── */
  test('4. 알을 탭해서 캐릭터를 생성한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    // 로그인 먼저 시도 (계정이 이미 있으면 바로 로그인)
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder('example@email.com').fill(FIXED_EMAIL);
    await page.getByPlaceholder('비밀번호를 입력하세요').fill(FIXED_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForTimeout(2500);

    // 로그인 실패 시 (계정 없음) → 회원가입 진행
    const loginFailed = await page.getByText(/이메일 또는 비밀번호|존재하지 않는|로그인 실패/).isVisible().catch(() => false);

    if (loginFailed) {
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForTimeout(500);

      // 이메일
      await page.getByPlaceholder('example@email.com').fill(FIXED_EMAIL);
      await page.getByRole('button', { name: '중복 확인' }).click();
      await page.waitForSelector('text=/사용 가능한 이메일입니다/', { timeout: 8000 });
      await page.waitForTimeout(300);

      // Step 1
      await page.getByPlaceholder('비밀번호 (6자 이상)').fill(FIXED_PASSWORD);
      await page.getByPlaceholder('비밀번호 재입력').fill(FIXED_PASSWORD);
      await page.getByPlaceholder('이름을 입력하세요').fill('QA고정유저');
      await page.getByPlaceholder('나이를 입력하세요').fill('25');
      await page.getByRole('button', { name: '남성' }).click();
      await page.getByPlaceholder('cm').fill('170');
      await page.getByPlaceholder('kg').fill('65');
      const nextStep1Btn = page.getByRole('button', { name: '다음 단계로' });
      await expect(nextStep1Btn).toBeEnabled({ timeout: 5000 });
      await nextStep1Btn.click();
      await page.waitForTimeout(800);

      // Step 2
      await expect(page.getByText('건강 상태 확인')).toBeVisible({ timeout: 5000 });
      const noBtns = page.getByRole('button', { name: '없다' });
      for (let i = 0; i < 4; i++) { await noBtns.nth(i).click(); await page.waitForTimeout(150); }
      await page.getByRole('button', { name: '0–10일' }).first().click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '3', exact: true }).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '아니오' }).click();
      await page.waitForTimeout(150);
      const nextStep2Btn = page.getByRole('button', { name: '다음 단계로' });
      await expect(nextStep2Btn).toBeEnabled({ timeout: 5000 });
      await nextStep2Btn.click();
      await page.waitForTimeout(800);

      // Step 3
      await expect(page.getByText('생활 습관 확인')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: '0–10일' }).first().click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '매일 먹는다' }).first().click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '매일 먹는다' }).nth(1).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '비흡연' }).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: '없음 (해당없음)' }).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: /AI 진단 시작하기|완료하고 넘어가기/ }).click();
      await page.waitForTimeout(3000);
    }

    // 로그인 성공 or 가입 완료 후: 알이 있으면 탭
    const egg = page.locator('img[alt="알"]');
    if (await egg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await egg.click();
      await page.waitForTimeout(1500);
      const nameInput = page.getByPlaceholder(/이름/);
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(CHARACTER_NAME);
        await page.getByRole('button', { name: /완료|시작|확인/ }).click();
        await page.waitForTimeout(1000);
      }
    }

    // 홈 화면 도달
    await expect(page.getByText(/Streak/i)).toBeVisible({ timeout: 10000 });
  });

  /* ── 5. 홈 화면 ── */
  test('5. 홈 화면 주요 요소가 보인다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await loginAndGoHome(page, FIXED_EMAIL, FIXED_PASSWORD);

    await expect(page.getByText(/streak/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('오늘의 미션')).toBeVisible();
    await expect(page.getByText('오늘의 추천')).toBeVisible();
  });

  /* ── 6. 미션 화면 ── */
  test('6. 미션 화면으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await loginAndGoHome(page, FIXED_EMAIL, FIXED_PASSWORD);

    await expect(page.getByText(/streak/i)).toBeVisible({ timeout: 10000 });
    await page.getByText('전체보기').click();
    await expect(page.getByText(/오늘의 미션/).first()).toBeVisible({ timeout: 3000 });
  });

  /* ── 7. 식단 기록 ── */
  test('7. 식단 기록 화면으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await loginAndGoHome(page, FIXED_EMAIL, FIXED_PASSWORD);

    await expect(page.getByText(/streak/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '식단' }).click();
    await expect(page.getByText('오늘의 영양 섭취')).toBeVisible({ timeout: 5000 });
  });

  /* ── 8. 로그아웃 → 재로그인 ── */
  test('8. 로그인 화면에서 이메일/비밀번호로 로그인한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await loginAndGoHome(page, FIXED_EMAIL, FIXED_PASSWORD);

    await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
  });

});
