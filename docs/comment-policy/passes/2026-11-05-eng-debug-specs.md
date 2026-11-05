# 2026-11-05 — 디버그 페이지 진단 spec 묶음 (두 번째 패스)

reconciler 작업 `rct_20261104-0002`. 범위: `e2e/eng/debug-back-button`·`debug-context`·`debug-detail-view`·`debug-page-layout`·`debug-route` 5개 spec과 `e2e/helpers/debug-setup.ts`·`e2e/helpers/favorites-setup.ts`. 판정 전 줄머리 주석 390줄 중 8줄을 유지하고 382줄을 제거했다. 코드는 건드리지 않았다(주석·빈 줄만 삭제).

## 제거 목록

| 유형 | 대상 | 비고 |
|---|---|---|
| 테스트 관례 | `// Arrange`·`// Act`·`// Assert`·`// Tests that …` 줄과 그 뒤에 붙은 한 줄 설명 | 테스트 이름과 `docs/product/test-*.md`가 말한다 |
| 코드 재진술 | `// Navigate to /debug`·`// Click first endpoint`·`// Ensure debug mode is OFF first`·`// Wait for React Router to process the navigation`·`// Grant clipboard permissions` 류, `debug-setup.ts` 안의 단계 설명, `// Use expect.poll to wait …` | 다음 줄이 이미 말한다 |
| 작업 흔적 | spec 머리 JSDoc 블록 전체(`Related Issue: DLD-…`·`Parent Issue`·`Activated for`·`Status: ACTIVE`·검증 항목 나열) | 끝난 작업 경위. 검증 항목은 테스트 이름이 말한다 |
| 소감·추측 | `debug-context.spec.ts`의 "This assertion might fail if other pages also call /api/pods …" | 단언이 아닌 추측이다 |
| 헬퍼 설명 | `debug-setup.ts`·`favorites-setup.ts` 함수 JSDoc | 함수 이름과 본문이 말한다(`e2e/helpers/`에는 doc 주석 수준을 요구하지 않는다). `favorites-setup.ts`는 주석이 모두 사라졌다 |

## 유지 목록

| 파일 | 유지한 주석 | 필요 사유 |
|---|---|---|
| `e2e/eng/debug-*.spec.ts` 5개 | `// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.` | 이 spec들이 제품 AC가 아닌 엔지니어링 진단 계약이라는 표지다 — 없으면 AC에 매핑되지 않은 고아 spec으로 보여 지워지거나 `자동화:` 필드에 잘못 연결된다(삭제하지 않고 `eng-notes.md`로 분리하기로 한 2026-07-12 결정) |
| `e2e/helpers/debug-setup.ts` | `Reload the page to trigger /api/overview call with debug interception active …` 3줄 | 첫 로드의 API 호출은 디버그 모드를 켜기 전이라 로그에 안 남는다는 사실 — 이 reload를 "중복 이동"으로 지우면 로그가 비어 모든 debug spec이 실패한다 |

## 범위 밖(후속)

- `.github/workflows/ci.yaml` 원장 행은 지난 패스 이후 CI 변경(#225)으로 줄 수·지문이 실측(28줄)과 어긋나 있어 이번에 행의 숫자만 맞췄다. 판정은 여전히 `—`이고 워크플로 파일은 건드리지 않는다(`workflows` 권한 필요).
- `e2e/eng/debug-toggle.spec.ts`(103줄)는 같은 `eng/` 묶음이지만 400줄 예산 때문에 다음 패스로 넘긴다.
- 나머지 L 행과 E 표면 44개 행.
