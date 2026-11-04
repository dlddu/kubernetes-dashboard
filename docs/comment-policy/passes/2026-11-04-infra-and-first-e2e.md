# 2026-11-04 — 빌드 설정 · 첫 e2e 묶음 (첫 패스)

reconciler 작업 `rct_20261104-0001`. 범위: `.dockerignore` · `.gitignore` · `Dockerfile` · `Makefile` · `Makefile.e2e` · e2e 8개 spec(`argo-data-states`·`argo-templates`·`argo-workflow-delete`·`argo-workflow-resubmit`·`common-namespace-deeplink`·`common-unhealthy-badge`·`configmaps-data-states`·`external-secrets-data-states`·`external-secrets-summary`) · 신설한 `scripts/comment-policy/`. 판정 전 줄머리 주석 399줄(신설 스크립트 제외) 중 20줄을 유지하고 나머지를 제거했다.

## 제거 목록

| 유형 | 대상 | 비고 |
|---|---|---|
| 코드 재진술 | `.dockerignore`·`.gitignore` 구역 이름, `Dockerfile` 단계·`COPY`·`RUN` 설명, `Makefile`·`Makefile.e2e` 머리와 설정 설명, 테스트 안의 `// Click template card` 류 | 다음 줄이 이미 말한다 |
| 테스트 관례 | `// Arrange`·`// Act`·`// Assert`·`// Step N` 줄, `// Tests that …` 설명 | 테스트 이름과 `docs/product/test-*.md`가 말한다 |
| 구분선·구획 | `// ----` 블록과 `Group N:` 이름 | 장식 |
| 작업 흔적 | spec 머리 블록의 `TDD Red Phase`·`Related Issue: DLD-…`·`Activated: DLD-…`, argo-workflow-delete 머리의 "placed last" | 끝난 작업 경위. "placed last"는 Group 4 유지 주석이 대신 말한다 |
| 저장소 문서·fixture 재진술 | spec 머리 블록의 fixture 목록, `// Verifies: <AC> — sole dedicated e2e spec` | fixture는 `test/fixtures/`가, AC 매핑은 테스트 문서의 `자동화:` 필드가 말한다. `Verifies:` 선언은 어떤 게이트도 파싱하지 않는다 |
| 헬퍼 설명 | `/** Navigate to /argo, click … */` 등 함수 JSDoc | 함수 이름과 본문이 말한다(테스트에는 doc 주석 수준을 요구하지 않는다) |
| 틀린 위치 | `argo-data-states` 로딩 테스트의 "(does not wait for networkidle …)" | `page.goto` 뒤에서는 networkidle을 기다린다 — 클릭 뒤 대기 금지라는 사유로 고쳐 클릭 앞으로 옮겼다 |

주석이 모두 사라진 파일: `.dockerignore`, `.gitignore`, `Makefile`, `Makefile.e2e`, `e2e/argo-workflow-resubmit.spec.ts`, `e2e/common-namespace-deeplink.spec.ts`, `e2e/configmaps-data-states.spec.ts`.

## 유지 목록

| 파일 | 유지한 주석 | 필요 사유 |
|---|---|---|
| `Dockerfile` | `Add ca-certificates for HTTPS and git for branch listing` | `git`을 지우면 브랜치 목록 기능이 런타임에서만 깨진다는 것을 이미지 이름만으로는 알 수 없다 |
| `e2e/argo-data-states.spec.ts` | "Do not wait for networkidle after the click …" | 기다리면 3초 지연 동안의 LoadingSkeleton을 놓쳐 테스트가 실패한다 |
| 〃 | "Do NOT wait for networkidle — we want to observe the loading state" (상세 로딩 테스트) | 위와 같다 |
| 〃 | `No API mocking — uses 'empty-runs-template' which has no workflow runs …` | 이 테스트가 기대는 fixture 불변식(실행 이력 없음)이다 |
| 〃 | 플래그 기반 500 응답 설명 5줄 | 호출 횟수 방식은 `useDataFetch`의 동시 fetch 때문에 경쟁 상태가 된다 — 같은 방식으로 "단순화"하면 불안정해진다 |
| `e2e/argo-templates.spec.ts` | `Both namespaces must be present …` | 목록이 안 바뀌어도 통과하는 거짓 양성을 막는 전제 |
| 〃 | `networkidle may already be satisfied …` | 네임스페이스 요청이 아직 대기 중일 때 networkidle이 이미 충족된 것으로 보이는 함정 |
| 〃 | `Wait for the complete rendered list …` | 이전 응답의 카드 스냅샷을 읽는 오판을 막는다 |
| `e2e/argo-workflow-delete.spec.ts` | `This test creates a new workflow and then deletes it. It does NOT touch shared fixtures …` | 실제 삭제를 하는 테스트가 공유 fixture를 건드리지 않는다는 보장 — 다른 병렬 테스트가 깨지는 것을 막는 불변식 |
| `e2e/common-unhealthy-badge.spec.ts` | `Regression guard: "0" must never appear …` 3줄 | 조건부 배지 밖에서 `{unhealthyPodCount}`가 "0"을 맨 텍스트로 그린 실제 버그를 잡는 검사임을 알려 지우지 못하게 한다 |
| `e2e/external-secrets-data-states.spec.ts` | `Switch to dashboard-empty (no ExternalSecret resources)` | 빈 상태 테스트가 기대는 fixture 불변식 |
| `e2e/external-secrets-summary.spec.ts` | `Fixtures: 3 ready … 1 not ready … = 4 total` 2줄 | 요약 카드 숫자 단언이 기대는 fixture 개수 |
| `scripts/comment-policy/measure.sh` | `파이프 소비자는 입력을 끝까지 읽는다 …` | 이 규칙을 어기면 입력이 64KB를 넘을 때 타이밍에 따라 실패·분기가 갈린다 |

`mock-exception:` 줄은 기계가 읽는 주석이라 손대지 않았다.

## 범위 밖(후속)

- `.github/workflows/ci.yaml`(10줄)·`e2e.yaml`(7줄): 워크플로 파일이라 자동 PR 권한 밖 — 사람 손 또는 `workflows` 권한이 있는 세션.
- `e2e/argo-submit.spec.ts`: 열린 PR #218과 파일이 겹쳐 뺐다.
- 나머지 235개 행(L)과 E 표면 44개 행: 원장의 `—` 행으로 다음 패스가 가져간다.
