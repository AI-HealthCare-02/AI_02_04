## 브랜치 전략

```
main
  ↑ PR + 1명 승인 + CI 통과 필수
develop
  ↑ PR + CI 통과 필수
feature/{이름}-{작업내용}
fix/{이름}-{버그내용}
```

## 브랜치 네이밍 컨벤션

| 타입      | 형식                    | 예시                       |
| --------- | ----------------------- | -------------------------- |
| 기능 개발 | `feature/{이름}-{작업}` | `feature/taeki-jwt-auth`   |
| 버그 수정 | `fix/{이름}-{작업}`     | `fix/taeki-token-refresh`  |
| 핫픽스    | `hotfix/{이름}-{작업}`  | `hotfix/taeki-login-error` |

---

## main 브랜치 보호 규칙 설정

1. GitHub 레포 → Settings → Branches
2. "Add branch protection rule" 클릭
3. Branch name pattern: `main`
4. 아래 항목 체크:

---

## PR 흐름

```
feature/taeki-jwt-auth
  ↓ PR
develop (리뷰 + CI 통과)
  ↓ PR (배포 전)
main (1명 승인 + CI 통과)
```

---

## 커밋 메시지 컨벤션

```
feature: JWT 인증 구현
fix: 토큰 만료 처리 버그 수정
docs: API 명세서 업데이트
refactor: 챌린지 서비스 리팩토링
test: 챌린지 API 테스트 추가
chore: requirements.txt 업데이트
```
