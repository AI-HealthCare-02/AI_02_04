import { test, expect, type Page } from '@playwright/test';

/**
 * 유저 타입별 미션 E2E 테스트
 *
 * 유저 타입 결정 로직:
 *  - diabetesStatus = "1"    → diabetic_1  (분석 화면 없이 바로 permissions)
 *  - diabetesStatus = "2"    → diabetic_2  (분석 화면 없이 바로 permissions)
 *  - diabetesStatus = "none" + BMI>=25 or age>=45 → at_risk (위험군 분석 화면)
 *  - diabetesStatus = "none" + 정상 BMI + 정상 나이 → 분석 화면에서 목표 선택
 *    · "체중 감량 및 다이어트"  → general_diet
 *    · "체력 증진 및 건강 개선" → general_health
 *    · "근력 증진 및 몸만들기"  → general_fitness
 *
 * 주의: serial 실행으로 API rate limit(429) 방지
 * 분석 애니메이션: 1500+1500+1500+1000+500 = 6000ms 소요 → 넉넉한 타임아웃 필요
 */

const TS = Date.now();
const PASSWORD = 'Test1234!';

// 유저 타입별 고유 미션 제목 (lib/store.ts 기준)
const MISSION_SIGNATURES = {
  general_diet:    '유산소 운동 30분',
  general_health:  '채소 섭취',
  general_fitness: '근력 운동 45분',
  at_risk:         '식후 걷기',
  diabetic_1:      '인슐린 주사 체크',
  diabetic_2:      '하체 운동',
} as const;

// 공통 미션 (lib/store.ts: id=c1 "만보 걷기", id=c2 "물 마시기")
const COMMON_MISSIONS = ['만보 걷기', '물 마시기'];

// ── 헬퍼: 온보딩 건너뛰기 ────────────────────────────────────────
async function skipOnboarding(page: Page) {
  const skipBtn = page.getByText('건너뛰기');
  if (await skipBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── 헬퍼: 회원가입 클릭 + Step 1 공통 정보 입력 ─────────────────
async function fillStep1(page: Page, email: string) {
  await page.getByRole('button', { name: '회원가입' }).click();
  await page.waitForTimeout(400);

  await page.getByPlaceholder('example@email.com').fill(email);
  await page.getByRole('button', { name: '중복 확인' }).click();
  await page.waitForSelector('text=/사용 가능한 이메일입니다/', { timeout: 10000 });
  await page.waitForTimeout(300);

  await page.getByPlaceholder('비밀번호 (6자 이상)').fill(PASSWORD);
  await page.getByPlaceholder('비밀번호 재입력').fill(PASSWORD);
  await page.getByPlaceholder('이름을 입력하세요').fill('QA유저');
}

// ── 헬퍼: 회원가입 Step 2 (건강 상태) ────────────────────────────
async function fillStep2(page: Page) {
  await expect(page.getByText('건강 상태 확인')).toBeVisible({ timeout: 5000 });
  const noBtns = page.getByRole('button', { name: '없다' });
  for (let i = 0; i < 4; i++) {
    await noBtns.nth(i).click();
    await page.waitForTimeout(100);
  }
  await page.getByRole('button', { name: '0–10일' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '아니오' }).click();
  await page.waitForTimeout(100);
}

// ── 헬퍼: 회원가입 Step 3 (생활 습관) ────────────────────────────
// diabetesOption: '없음 (해당없음)' | '1형 당뇨' | '2형 당뇨'
async function fillStep3(page: Page, diabetesOption: string) {
  await expect(page.getByText('생활 습관 확인')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: '0–10일' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '매일 먹는다' }).first().click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '매일 먹는다' }).nth(1).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '비흡연' }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: diabetesOption }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /AI 진단 시작하기|완료하고 넘어가기/ }).click();

  // API 호출 완료 + 화면 전환 대기 (Step 3 헤더가 사라질 때까지)
  await expect(page.getByText('생활 습관 확인')).toBeHidden({ timeout: 15000 });
}

// ── 헬퍼: 분석 화면 — 목표 카드 선택 후 시작 ────────────────────
// 분석 애니메이션이 ~6초 소요되므로 넉넉한 타임아웃 사용
async function selectAnalysisGoal(page: Page, goalText: string) {
  await expect(page.getByText(goalText)).toBeVisible({ timeout: 12000 });
  await page.getByText(goalText).click();
  await page.waitForTimeout(300);
  // 버튼 텍스트: "[goalText] 시작하기"
  const startBtn = page.getByRole('button', { name: new RegExp(`${goalText} 시작하기`) });
  await expect(startBtn).toBeEnabled({ timeout: 3000 });
  await startBtn.click();
  await page.waitForTimeout(500);
}

// ── 헬퍼: 분석 화면 — 위험군 버튼 클릭 ─────────────────────────
async function selectRiskGroup(page: Page) {
  const riskBtn = page.getByRole('button', { name: /위험군 건강 관리 시작하기/ });
  await expect(riskBtn).toBeVisible({ timeout: 12000 });
  await riskBtn.click();
  await page.waitForTimeout(500);
}

// ── 헬퍼: permissions 화면 처리 ──────────────────────────────────
// Switch는 Radix UI → role="switch" 로 렌더링됨
async function handlePermissions(page: Page) {
  // 권한 화면 도달 확인 (exact: true 로 strict mode 위반 방지)
  await expect(page.getByText('건강 데이터', { exact: true })).toBeVisible({ timeout: 10000 });
  // 필수 권한 2개 (건강 데이터, 활동 추적) 토글
  const switches = page.getByRole('switch');
  await switches.nth(0).click(); // 건강 데이터
  await page.waitForTimeout(200);
  await switches.nth(1).click(); // 활동 추적
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '캐릭터 만나러 가기' }).click();
  await page.waitForTimeout(1000);
}

// ── 헬퍼: 캐릭터 탄생 화면 처리 ──────────────────────────────────
// 흐름: egg 클릭 → hatching(1500ms) → sparkles → born(600ms) → 이름 입력 폼
//       → "이름 짓기" 클릭 → 2500ms 후 홈으로 이동
async function handleCharacterBirth(page: Page) {
  // 알 단계인 경우 egg 클릭 (bounce 애니메이션으로 force:true 필요)
  const egg = page.locator('img[alt="알"]');
  if (await egg.isVisible({ timeout: 5000 }).catch(() => false)) {
    await egg.click({ force: true });
  }

  // born 단계: 이름 입력 폼이 나타날 때까지 대기 (최대 8초 = 2100ms 애니메이션 + 여유)
  const nameInput = page.getByPlaceholder('이름을 입력해주세요');
  await expect(nameInput).toBeVisible({ timeout: 8000 });
  await nameInput.fill('테스트캐릭터');
  await page.waitForTimeout(100);

  // "이름 짓기" 버튼: 이름 입력 시 활성화됨
  const nameBtn = page.getByRole('button', { name: '이름 짓기' });
  await expect(nameBtn).toBeEnabled({ timeout: 3000 });
  await nameBtn.click();

  // handleNameSubmit: setTimeout 2500ms 후 홈으로 이동
  await page.waitForTimeout(3000);
}

// ── 헬퍼: 홈 → 미션 화면으로 이동 ───────────────────────────────
async function goToMissions(page: Page) {
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '미션' }).click();
  await page.waitForTimeout(1000);
}

// ── 헬퍼: 미션 제목 확인 (exact: true 로 설명 텍스트와 구별) ──────
async function verifyMission(page: Page, missionTitle: string) {
  await expect(page.getByText(missionTitle, { exact: true }).first()).toBeVisible({ timeout: 5000 });
}

// ── 헬퍼: 공통 미션 확인 (만보 걷기, 물 마시기) ──────────────────
async function verifyCommonMissions(page: Page) {
  for (const title of COMMON_MISSIONS) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible({ timeout: 3000 });
  }
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: API rate limit 방지를 위해 순차 실행
// ═══════════════════════════════════════════════════════════════
test.describe.serial('유저 타입별 미션 검증', () => {
  // 각 테스트: splash(3s) + API + 분석 애니메이션(6s) + 캐릭터 탄생 등 → 넉넉히 2분
  test.setTimeout(120000);

  // ── U-01: general_diet ──────────────────────────────────────
  test('U-01 general_diet: 다이어트 목표 선택 시 식단+유산소 미션 제공', async ({ page }) => {
    const email = `qa_diet_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    // Step 1
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('25');   // 정상 나이 (<45)
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByPlaceholder('cm').fill('170');
    await page.getByPlaceholder('kg').fill('60');                  // BMI 20.8 → 정상 (<25)
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Step 2
    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    // Step 3 — 당뇨 없음 → 분석 화면으로 이동
    await fillStep3(page, '없음 (해당없음)');

    // 분석 화면 — 체중 감량 목표 선택
    await selectAnalysisGoal(page, '체중 감량 및 다이어트');

    // Permissions → 캐릭터 탄생 → 홈
    await handlePermissions(page);
    await handleCharacterBirth(page);

    // 미션 화면 검증
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.general_diet);
    await verifyCommonMissions(page);

    console.log('✅ U-01 general_diet 미션 검증 완료');
  });

  // ── U-02: general_health ────────────────────────────────────
  test('U-02 general_health: 건강 개선 목표 선택 시 채소/과일/스트레칭 미션 제공', async ({ page }) => {
    const email = `qa_health_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('30');
    await page.getByRole('button', { name: '여성' }).click();
    await page.getByPlaceholder('cm').fill('165');
    await page.getByPlaceholder('kg').fill('55');                  // BMI 20.2 → 정상
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    await fillStep3(page, '없음 (해당없음)');

    // 분석 화면 — 체력 증진 목표 선택
    await selectAnalysisGoal(page, '체력 증진 및 건강 개선');

    await handlePermissions(page);
    await handleCharacterBirth(page);
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.general_health);
    await verifyCommonMissions(page);

    console.log('✅ U-02 general_health 미션 검증 완료');
  });

  // ── U-03: general_fitness ───────────────────────────────────
  test('U-03 general_fitness: 몸만들기 목표 선택 시 근력운동 미션 제공', async ({ page }) => {
    const email = `qa_fit_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('28');
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByPlaceholder('cm').fill('175');
    await page.getByPlaceholder('kg').fill('70');                  // BMI 22.9 → 정상
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    await fillStep3(page, '없음 (해당없음)');

    // 분석 화면 — 근력 증진 목표 선택
    await selectAnalysisGoal(page, '근력 증진 및 몸만들기');

    await handlePermissions(page);
    await handleCharacterBirth(page);
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.general_fitness);
    await verifyCommonMissions(page);

    console.log('✅ U-03 general_fitness 미션 검증 완료');
  });

  // ── U-04: at_risk ───────────────────────────────────────────
  test('U-04 at_risk: BMI≥25이면 위험군 판정 후 at_risk 미션 제공', async ({ page }) => {
    const email = `qa_risk_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('35');
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByPlaceholder('cm').fill('170');
    await page.getByPlaceholder('kg').fill('80');                  // BMI 27.7 → 위험군
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    await fillStep3(page, '없음 (해당없음)');

    // 분석 화면 — 위험군 버튼 클릭
    await selectRiskGroup(page);

    await handlePermissions(page);
    await handleCharacterBirth(page);
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.at_risk);
    await verifyCommonMissions(page);

    console.log('✅ U-04 at_risk 미션 검증 완료');
  });

  // ── U-05: diabetic_1 ────────────────────────────────────────
  test('U-05 diabetic_1: 1형 당뇨 선택 시 인슐린 관련 미션 제공', async ({ page }) => {
    const email = `qa_db1_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('32');
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByPlaceholder('cm').fill('175');
    await page.getByPlaceholder('kg').fill('68');
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    // Step 3 — 1형 당뇨 선택 → 분석 화면 없이 바로 permissions
    await fillStep3(page, '1형 당뇨');

    await handlePermissions(page);
    await handleCharacterBirth(page);
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.diabetic_1);
    await verifyCommonMissions(page);

    console.log('✅ U-05 diabetic_1 미션 검증 완료');
  });

  // ── U-06: diabetic_2 ────────────────────────────────────────
  test('U-06 diabetic_2: 2형 당뇨 선택 시 하체운동/탄수화물 관리 미션 제공', async ({ page }) => {
    const email = `qa_db2_${TS}@test.com`;

    await page.goto('/');
    await page.waitForTimeout(3000);
    await skipOnboarding(page);

    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });
    await fillStep1(page, email);
    await page.getByPlaceholder('나이를 입력하세요').fill('50');
    await page.getByRole('button', { name: '여성' }).click();
    await page.getByPlaceholder('cm').fill('160');
    await page.getByPlaceholder('kg').fill('65');
    const nextBtn = page.getByRole('button', { name: '다음 단계로' });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(800);

    await fillStep2(page);
    const next2 = page.getByRole('button', { name: '다음 단계로' });
    await expect(next2).toBeEnabled({ timeout: 5000 });
    await next2.click();
    await page.waitForTimeout(800);

    // Step 3 — 2형 당뇨 선택 → 분석 화면 없이 바로 permissions
    await fillStep3(page, '2형 당뇨');

    await handlePermissions(page);
    await handleCharacterBirth(page);
    await goToMissions(page);
    await verifyMission(page, MISSION_SIGNATURES.diabetic_2);
    await verifyCommonMissions(page);

    console.log('✅ U-06 diabetic_2 미션 검증 완료');
  });

});
