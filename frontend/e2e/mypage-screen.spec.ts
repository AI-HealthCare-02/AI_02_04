import { test, expect, type Page } from '@playwright/test';

/**
 * 마이페이지 화면 E2E 테스트 (P-01 ~ P-05)
 *
 * 전제: qa_golden@test.com 계정 + 캐릭터가 이미 생성되어 있어야 함
 *
 * 검증 항목:
 *  P-01 - 마이페이지 기본 UI (인사 텍스트, 메뉴 섹션 3개, 메뉴 아이템 7개)
 *  P-02 - 프로필 히어로 카드 (캐릭터명, Lv.N 배지, 스탯 3종 라벨)
 *  P-03 - 내 건강 섹션 화면 이동 (건강 정보 수정 · 주간 건강 리포트)
 *  P-04 - 연동 및 알림 섹션 화면 이동 (건강 데이터 연동 · 맞춤형 푸시 알림)
 *  P-05 - 로그아웃 플로우 (확인 다이얼로그 → 취소 → 재시도 → 로그아웃 완료)
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

// ── 헬퍼: 로그인 → 홈 → 마이페이지 진입 ──────────────────────────
async function loginAndGoMyPage(page: Page) {
  const emailInput = page.getByPlaceholder('example@email.com');
  await expect(emailInput).toBeVisible({ timeout: 8000 });
  await emailInput.fill(FIXED_EMAIL);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(FIXED_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('Streak days')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '내 건강' }).click();
  // 마이페이지 진입 확인: 계정 섹션 헤더
  await expect(page.getByText('계정')).toBeVisible({ timeout: 5000 });
}

// ── 공통 셋업 ────────────────────────────────────────────────────
async function setup(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await skipOnboarding(page);
  await loginAndGoMyPage(page);
}

// ── 헬퍼: 서브 화면에서 뒤로가기 ──────────────────────────────────
async function goBack(page: Page) {
  // ScrollHeader(fixed, -translate-y-full)가 nth(0) → viewport 밖
  // 실제 헤더의 ArrowLeft 버튼이 nth(1) → viewport 안쪽
  await page.locator('button:has(svg)').nth(1).click();
}

// ═══════════════════════════════════════════════════════════════
//  테스트 수트 — serial: 병렬 로그인 API 429 방지
// ═══════════════════════════════════════════════════════════════
test.describe.serial('마이페이지 화면', () => {
  test.setTimeout(60000);

  /* ── P-01: 마이페이지 기본 UI ── */
  test('P-01: 마이페이지 기본 UI 요소가 표시된다', async ({ page }) => {
    await setup(page);

    // 인사 텍스트 (시간대별: 좋은 아침·오후·저녁·반가워요)
    await expect(
      page.getByText(/좋은 아침이에요|좋은 오후에요|좋은 저녁이에요|반가워요/)
    ).toBeVisible();

    // 메뉴 섹션 헤더 3개
    await expect(page.getByText('내 건강').first()).toBeVisible();
    await expect(page.getByText('연동 및 알림')).toBeVisible();
    await expect(page.getByText('계정')).toBeVisible();

    // 내 건강 섹션 메뉴 아이템
    await expect(page.getByText('건강 정보 수정')).toBeVisible();
    await expect(page.getByText('일일 건강 기록')).toBeVisible();
    await expect(page.getByText('주간 건강 리포트')).toBeVisible();

    // 연동 및 알림 섹션 메뉴 아이템
    await expect(page.getByText('건강 데이터 연동').first()).toBeVisible();
    await expect(page.getByText('맞춤형 푸시 알림')).toBeVisible();

    // 계정 섹션 메뉴 아이템
    await expect(page.getByText('로그아웃')).toBeVisible();
    await expect(page.getByText('회원탈퇴')).toBeVisible();

    console.log('✅ P-01 마이페이지 기본 UI 확인 완료');
  });

  /* ── P-02: 프로필 히어로 카드 ── */
  test('P-02: 프로필 히어로 카드(캐릭터명·레벨·스탯)가 표시된다', async ({ page }) => {
    await setup(page);

    // 캐릭터 이름 or "캐릭터 없음"
    await expect(
      page.getByText(/캐릭터 없음/).or(page.locator('.text-\\[16px\\]').first())
    ).toBeVisible({ timeout: 5000 });

    // Lv.N 배지
    await expect(page.getByText(/Lv\.\d+/).first()).toBeVisible();

    // 스탯 3종 라벨 (누적 경험치, 오늘 미션, 캐릭터)
    await expect(page.getByText('누적 경험치')).toBeVisible();
    await expect(page.getByText('오늘 미션')).toBeVisible();
    await expect(page.getByText('캐릭터', { exact: true })).toBeVisible();

    // XP 단위 텍스트
    await expect(page.getByText('XP').first()).toBeVisible();

    // 건강타입 배지 (일반 관리 · 위험군 관리 · 당뇨 관리 등)
    await expect(
      page.getByText(/일반 관리|위험군 관리|제1형 당뇨 관리|제2형 당뇨 관리/).first()
    ).toBeVisible();

    console.log('✅ P-02 프로필 히어로 카드 확인 완료');
  });

  /* ── P-03: 내 건강 섹션 화면 이동 ── */
  test('P-03: 내 건강 섹션 메뉴 클릭 시 해당 화면으로 이동한다', async ({ page }) => {
    await setup(page);

    // ① 건강 정보 수정 → 내 건강 정보 화면
    await page.getByText('건강 정보 수정').click();
    await expect(
      page.getByText(/내 건강 정보|건강 프로필 수정/).first()
    ).toBeVisible({ timeout: 5000 });

    // 뒤로가기 → 마이페이지 복귀
    await goBack(page);
    await expect(page.getByText('계정')).toBeVisible({ timeout: 3000 });

    // ② 일일 건강 기록 → 일일 건강 기록 화면
    await page.getByText('일일 건강 기록').click();
    await expect(page.getByText('일일 건강 기록').nth(1)).toBeVisible({ timeout: 5000 });

    // 뒤로가기 → 마이페이지 복귀
    await goBack(page);
    await expect(page.getByText('계정')).toBeVisible({ timeout: 3000 });

    // ③ 주간 건강 리포트 → 주간 건강 리포트 화면
    await page.getByText('주간 건강 리포트').click();
    await expect(page.getByText('주간 건강 리포트').nth(1)).toBeVisible({ timeout: 5000 });

    console.log('✅ P-03 내 건강 섹션 화면 이동 확인 완료');
  });

  /* ── P-04: 연동 및 알림 섹션 화면 이동 ── */
  test('P-04: 연동 및 알림 섹션 메뉴 클릭 시 해당 화면으로 이동한다', async ({ page }) => {
    await setup(page);

    // ① 건강 데이터 연동 → 건강 데이터 연동 화면
    await page.getByText('건강 데이터 연동').first().click();
    await expect(page.getByText('워치·앱 데이터 동기화')).toBeVisible({ timeout: 5000 });

    // 뒤로가기 → 마이페이지 복귀
    await goBack(page);
    await expect(page.getByText('연동 및 알림')).toBeVisible({ timeout: 3000 });

    // ② 맞춤형 푸시 알림 → 알림 설정 화면
    await page.getByText('맞춤형 푸시 알림').click();
    await expect(page.getByText('알림 권한 및 수신 설정')).toBeVisible({ timeout: 5000 });

    console.log('✅ P-04 연동 및 알림 섹션 화면 이동 확인 완료');
  });

  /* ── P-05: 로그아웃 플로우 ── */
  test('P-05: 로그아웃 다이얼로그 확인 후 로그인 화면으로 이동한다', async ({ page }) => {
    await setup(page);

    // 로그아웃 버튼 클릭 → 확인 다이얼로그 표시
    await page.getByText('로그아웃').click();
    await expect(page.getByText('로그아웃 하시겠습니까?')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('로그아웃하면 다시 로그인이 필요합니다.')).toBeVisible();

    // "취소" 클릭 → 다이얼로그 닫힘, 여전히 마이페이지
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByText('로그아웃 하시겠습니까?')).not.toBeVisible({ timeout: 2000 });
    await expect(page.getByText('계정')).toBeVisible();

    // 다시 로그아웃 → 확인 클릭 → 로그인 화면 복귀
    await page.getByText('로그아웃').click();
    await expect(page.getByText('로그아웃 하시겠습니까?')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: '로그아웃' }).last().click();

    // 로그인 화면으로 복귀 확인
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible({ timeout: 8000 });

    console.log('✅ P-05 로그아웃 플로우 확인 완료');
  });

});
