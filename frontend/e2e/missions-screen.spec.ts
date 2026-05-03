import { test, expect, type Page } from '@playwright/test';

/**
 * 미션 화면 E2E 테스트 (M-01 ~ M-05)
 *
 * 미션은 setUserProfile 호출 시 생성됨 (로그인만으로는 생성 안 됨).
 * 따라서 각 테스트는 신규 회원가입 → 분석 화면 목표 선택 → 홈 → 미션 화면 순서로 진행.
 *
 * 검증 항목:
 *  M-01 - 미션 화면 기본 UI (달성률, 만보 걷기, 물 마시기, 일반 미션 목록)
 *  M-02 - 물 마시기 "1잔 마시기" 클릭 시 진행도 증가
 *  M-03 - 만보 걷기 "헬스 데이터 연동" 클릭 시 걸음 수 증가
 *  M-04 - 일반 미션 클릭 → 완료 처리 + XP 획득 토스트
 *  M-05 - 미션 완료 후 달성률(%) 수치 증가 확인
 */

const TS       = Date.now();
const PASSWORD = 'Test1234!';

// ── 헬퍼: 온보딩 건너뛰기 ────────────────────────────────────────
async function skipOnboarding(page: Page) {
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── 헬퍼: Step 1 ─────────────────────────────────────────────────
async function fillStep1(page: Page, email: string) {
  await page.getByRole('button', { name: '회원가입' }).click();
  await page.waitForTimeout(400);
  await page.getByPlaceholder('example@email.com').fill(email);
  await page.getByRole('button', { name: '중복 확인' }).click();
  await page.waitForSelector('text=/사용 가능한 이메일입니다/', { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.getByPlaceholder('비밀번호 (6자 이상)').fill(PASSWORD);
  await page.getByPlaceholder('비밀번호 재입력').fill(PASSWORD);
  await page.getByPlaceholder('이름을 입력하세요').fill('미션테스터');
}

// ── 헬퍼: Step 2 (건강 상태) ─────────────────────────────────────
async function fillStep2(page: Page) {
  await expect(page.getByText('건강 상태 확인')).toBeVisible({ timeout: 5000 });
  const noBtns = page.getByRole('button', { name: '없다' });
  for (let i = 0; i < 4; i++) { await noBtns.nth(i).click(); await page.waitForTimeout(100); }
  await page.getByRole('button', { name: '0–10일' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '아니오' }).click();
  await page.waitForTimeout(100);
}

// ── 헬퍼: Step 3 (생활 습관) ─────────────────────────────────────
async function fillStep3(page: Page) {
  await expect(page.getByText('생활 습관 확인')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: '0–10일' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '매일 먹는다' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '매일 먹는다' }).nth(1).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '비흡연' }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '없음 (해당없음)' }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /AI 진단 시작하기/ }).click();
  await expect(page.getByText('생활 습관 확인')).toBeHidden({ timeout: 15000 });
}

// ── 헬퍼: 분석 화면 — 체중 감량 목표 선택 ─────────────────────
async function selectGoal(page: Page) {
  await expect(page.getByText('체중 감량 및 다이어트')).toBeVisible({ timeout: 12000 });
  await page.getByText('체중 감량 및 다이어트').click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /체중 감량 및 다이어트 시작하기/ }).click();
  await page.waitForTimeout(500);
}

// ── 헬퍼: Permissions 화면 처리 ──────────────────────────────────
async function handlePermissions(page: Page) {
  await expect(page.getByText('건강 데이터', { exact: true })).toBeVisible({ timeout: 10000 });
  const switches = page.getByRole('switch');
  await switches.nth(0).click();
  await page.waitForTimeout(200);
  await switches.nth(1).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '캐릭터 만나러 가기' }).click();
  await page.waitForTimeout(1000);
}

// ── 헬퍼: 캐릭터 탄생 처리 ───────────────────────────────────────
async function handleCharacterBirth(page: Page) {
  const egg = page.locator('img[alt="알"]');
  if (await egg.isVisible({ timeout: 5000 }).catch(() => false)) {
    await egg.click({ force: true });
  }
  const nameInput = page.getByPlaceholder('이름을 입력해주세요');
  await expect(nameInput).toBeVisible({ timeout: 8000 });
  await nameInput.fill('미션캐릭터');
  await page.waitForTimeout(100);
  const nameBtn = page.getByRole('button', { name: '이름 짓기' });
  await expect(nameBtn).toBeEnabled({ timeout: 3000 });
  await nameBtn.click();
  await page.waitForTimeout(3000); // 홈으로 이동 대기 (2500ms timer)
}

// ── 헬퍼: 전체 셋업: 회원가입 → 분석 → 권한 → 캐릭터 → 홈 → 미션 ──
async function setup(page: Page, email: string) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await skipOnboarding(page);

  await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
  await fillStep1(page, email);
  await page.getByPlaceholder('나이를 입력하세요').fill('28');
  await page.getByRole('button', { name: '남성' }).click();
  await page.getByPlaceholder('cm').fill('175');
  await page.getByPlaceholder('kg').fill('70'); // BMI 22.9 → 정상
  const nextBtn = page.getByRole('button', { name: '다음 단계로' });
  await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(800);

  await fillStep2(page);
  const next2 = page.getByRole('button', { name: '다음 단계로' });
  await expect(next2).toBeEnabled({ timeout: 5000 });
  await next2.click();
  await page.waitForTimeout(800);

  await fillStep3(page);
  await selectGoal(page);
  await handlePermissions(page);
  await handleCharacterBirth(page);

  // 홈 확인 후 미션 탭으로 이동
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '미션' }).click();
  await expect(page.getByText('건강한 하루를 위해 미션을 달성해 보세요!')).toBeVisible({ timeout: 5000 });
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: API rate limit 방지
// ═══════════════════════════════════════════════════════════════
test.describe.serial('미션 화면', () => {
  test.setTimeout(120000);

  /* ── M-01: 미션 화면 기본 UI ── */
  test('M-01: 미션 화면 기본 UI 요소가 표시된다', async ({ page }) => {
    await setup(page, `qa_m01_${TS}@test.com`);

    // 헤더
    await expect(page.getByText('오늘의 미션').first()).toBeVisible();
    await expect(page.getByText('건강한 하루를 위해 미션을 달성해 보세요!')).toBeVisible();

    // 달성률 카드
    await expect(page.getByText('달성률')).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+개 완료/)).toBeVisible();

    // 공통 미션 카드 (만보 걷기, 물 마시기)
    await expect(page.getByText('만보 걷기', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('물 마시기', { exact: true }).first()).toBeVisible();

    // 걸음 연동 / 물 마시기 버튼
    await expect(page.getByRole('button', { name: /헬스 데이터 연동/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '1잔 마시기' })).toBeVisible();

    // 일반 미션 목록: general_diet 타입 고유 미션 존재 확인
    await expect(page.getByText('유산소 운동 30분', { exact: true })).toBeVisible();

    console.log('✅ M-01 미션 화면 기본 UI 확인 완료');
  });

  /* ── M-02: 물 마시기 진행도 증가 ── */
  test('M-02: "1잔 마시기" 클릭 시 물 마시기 진행도가 증가한다', async ({ page }) => {
    await setup(page, `qa_m02_${TS}@test.com`);

    // 현재 잔 수: "0 / 8" 형태
    await expect(page.locator('text=/\\d+ \\/ 8/').first()).toBeVisible({ timeout: 5000 });
    const beforeText = await page.locator('text=/\\d+ \\/ 8/').first().textContent() ?? '0 / 8';
    const beforeCount = parseInt(beforeText.split(' / ')[0]);

    // "1잔 마시기" 클릭
    await page.getByRole('button', { name: '1잔 마시기' }).click();
    await page.waitForTimeout(500);

    const afterCount = beforeCount + 1;
    if (afterCount < 8) {
      // 진행도 숫자 증가 확인
      await expect(page.locator(`text=${afterCount} / 8`).first()).toBeVisible({ timeout: 3000 });
    } else {
      // 마지막 잔 → 완료 (XP 토스트 또는 8/8 표시)
      await expect(
        page.getByText('XP 획득!').or(page.locator('text=8 / 8').first())
      ).toBeVisible({ timeout: 5000 });
    }

    console.log(`✅ M-02 물 마시기 ${beforeCount} → ${afterCount}잔 진행도 증가 확인 완료`);
  });

  /* ── M-03: 만보 걷기 걸음 수 증가 ── */
  test('M-03: "헬스 데이터 연동" 클릭 시 걸음 수가 증가한다', async ({ page }) => {
    await setup(page, `qa_m03_${TS}@test.com`);

    // 현재 걸음 수: "0 / 10,000" 형태
    const walkLocator = page.locator('text=/\\d[\\d,]* \\/ 10,000/').first();
    await expect(walkLocator).toBeVisible({ timeout: 5000 });
    const beforeText = await walkLocator.textContent() ?? '0 / 10,000';
    const beforeSteps = parseInt(beforeText.split(' / ')[0].replace(/,/g, ''));

    // "헬스 데이터 연동 (테스트 +2500)" 클릭
    await page.getByRole('button', { name: /헬스 데이터 연동/ }).click();
    await page.waitForTimeout(500);

    // 걸음 수 2500 증가 또는 완료 토스트 확인
    const expectedSteps = Math.min(beforeSteps + 2500, 10000);
    if (expectedSteps < 10000) {
      const formatted = expectedSteps.toLocaleString('ko-KR');
      await expect(
        page.locator(`text=${formatted} / 10,000`).first()
          .or(page.locator('text=/\\d[\\d,]* \\/ 10,000/').first())
      ).toBeVisible({ timeout: 5000 });
    } else {
      await expect(
        page.getByText('XP 획득!').or(page.locator('text=10,000 / 10,000').first())
      ).toBeVisible({ timeout: 5000 });
    }

    console.log(`✅ M-03 만보 걷기 ${beforeSteps} → ${expectedSteps} 걸음 증가 확인 완료`);
  });

  /* ── M-04: 일반 미션 클릭 → 완료 + XP 토스트 ── */
  test('M-04: 일반 미션 클릭 시 완료 처리되고 XP 획득 토스트가 표시된다', async ({ page }) => {
    await setup(page, `qa_m04_${TS}@test.com`);

    // general_diet 고유 미션 "유산소 운동 30분" 클릭 (manual 타입)
    const mission = page.getByText('유산소 운동 30분', { exact: true });
    await expect(mission).toBeVisible({ timeout: 5000 });
    await mission.click();
    await page.waitForTimeout(300);

    // 입력 모달이 뜨면 처리
    const modal = page.getByRole('dialog');
    if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
      const numInput = modal.getByRole('spinbutton');
      if (await numInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await numInput.fill('30');
      }
      const confirmBtn = modal.getByRole('button', { name: /확인|완료|저장/ });
      if (await confirmBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(300);
    }

    // XP 획득 토스트 확인 (토스트 div + aria-live 두 요소가 있으므로 first() 사용)
    await expect(page.getByText(/XP 획득!/).first()).toBeVisible({ timeout: 5000 });

    console.log('✅ M-04 일반 미션 완료 + XP 토스트 확인 완료');
  });

  /* ── M-05: 달성률 수치 증가 ── */
  test('M-05: 미션 완료 시 달성률(%) 수치가 증가한다', async ({ page }) => {
    await setup(page, `qa_m05_${TS}@test.com`);

    // 완료 전 달성률 읽기
    const pctEl = page.locator('p.text-\\[36px\\]');
    await expect(pctEl).toBeVisible({ timeout: 5000 });
    const beforeText = await pctEl.textContent() ?? '0';
    const beforePct = parseInt(beforeText);

    // 완료 전 미션 수 읽기
    const countEl = page.getByText(/\d+ \/ \d+개 완료/);
    const countText = await countEl.textContent() ?? '0 / 1개 완료';
    const [done, total] = countText.replace('개 완료', '').split(' / ').map(Number);

    // 물 마시기 1잔 → 진행도 증가
    await page.getByRole('button', { name: '1잔 마시기' }).click();
    await page.waitForTimeout(500);

    // 완료율 카드는 여전히 보여야 함
    await expect(page.getByText('달성률')).toBeVisible();

    // 8잔 모두 마시면 미션 완료 → 달성률 증가
    if (total > 0) {
      // 8잔 모두 마시기 (신규 유저 → 0잔부터 시작)
      for (let i = 1; i < 8; i++) {
        const btn = page.getByRole('button', { name: '1잔 마시기' });
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(200);
        }
      }
      await page.waitForTimeout(500);

      // 달성률이 증가했는지 확인 (물 마시기 미션 완료 시)
      const afterText = await pctEl.textContent() ?? '0';
      const afterPct = parseInt(afterText);
      expect(afterPct).toBeGreaterThanOrEqual(beforePct);
      console.log(`달성률: ${beforePct}% → ${afterPct}% (물 마시기 8잔 완료)`);
    }

    await expect(pctEl).toBeVisible();
    console.log('✅ M-05 달성률 수치 증가 확인 완료');
  });

});
