# e2e 네트워크 모킹·인터셉트 정책 (SSOT)

> 이 문서는 `dlddu/kubernetes-dashboard` e2e(Playwright)에서 네트워크 인터셉트·응답
> 모킹을 **어디까지 허용하는지**와 **현재 승인된 예외 목록**을 정의하는 단일 진실
> 공급원(SSOT)이다. reconciler 정합성 모델 `tbm_kubernetes-dashboard-e2e-mock-policy`가
> 이 문서(to-be)와 `e2e/**/*.ts`의 실제 인터셉트(as-is)를 **양방향 1:1**로 유지한다.

## 원칙

e2e는 **kind 실클러스터 + 실제 fixture**를 대상으로 도는 것이 기본이다. 네트워크
인터셉트(`page.route`/`context.route`/`routeFromHAR`/`routeWebSocket`/`unroute`,
`route.fulfill`/`abort`/`continue`, 그리고 MSW·nock·sinon·`vi.mock` 류 도입)와 응답
모킹은 **실환경으로 재현이 불가능한 경우에 한해서만**, 그리고 **아래 허용목록에 등재된
지점에 한해서만** 허용한다. 편의(fixture 준비 회피, 어서션 단순화, 플레이키 무마)를
위한 모킹은 정책 위반(drift)이다.

## 허용 예외 카테고리

이 밖의 사유로는 인터셉트를 쓸 수 없다.

| 코드 | 의미 |
|------|------|
| `ERR` | 서버 실패 응답(5xx·네트워크 오류) 기반 에러·재시도 UI. 실클러스터가 요청 시점에 오류를 내도록 만들 수 없는 경우. |
| `LAT` | 응답 지연 주입이 필요한 로딩·스켈레톤·폴링 인디케이터 상태. |
| `ABS` | 클러스터에 존재시킬 수 없는 외부 시스템/CRD 의존. **단 kind에 fixture·CRD로 설치 가능하면 그쪽이 우선**이며 이 카테고리를 쓸 수 없다. |
| `DES` | 되돌릴 수 없거나 다른 spec을 오염시키는 파괴적 mutation(삭제·재시작 등)의 "요청이 나갔는가" 검증. |

**명시적 불허**: 목록·개수·상태 조합을 고정하려는 데이터 모킹(→ fixture 또는 전용
namespace로 해결), 플레이키 회피용 모킹(→ 원인 수정), 백엔드 미구현 우회(→ skip 처리
후 이슈로 추적). 카테고리 판정이 애매하면 **제거 쪽으로 기운다**. 예외는 늘지 않는
방향으로만 관리한다.

## 표기 규약

허용된 인터셉트는 등록(`page.route(...)` 등) **직전 줄**에 사유 주석을 단다.

```
// mock-exception: <CODE> — <실환경으로 불가능한 이유 한 줄>
```

같은 항목이 아래 **허용목록**에도 있어야 한다. 주석만 있고 미등재이거나, 등재만 있고
코드에 없으면 drift다.

## 허용목록 (승인된 예외)

아래에 등재된 인터셉트만 허용된다. 각 행은 하나의 인터셉트 **등록 지점**
(`page.route`/`context.route` 등, 코드의 `// mock-exception:` 주석이 붙는 곳)을 가리키며,
그 핸들러 콜백 내부의 `route.fulfill`/`continue`/`abort`와 짝이 되는 `page.unroute`는 해당
행이 함께 포괄한다. 각 행은 코드의 `// mock-exception:` 주석과 1:1로 대응한다(양방향).

| # | 파일 | 대상 API 패턴 | 카테고리 | 실환경 불가 사유 |
|---|------|---------------|:--------:|------------------|
| 1 | `e2e/argo-workflow-delete.spec.ts` | `**/api/argo/workflows/**` (DELETE) | `ERR` | 삭제 API 실패 시 다이얼로그 에러 메시지 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 2 | `e2e/argo-workflow-resubmit.spec.ts` | `**/api/argo/workflows/*/resubmit` (POST) | `ERR` | resubmit API 실패 시 에러 메시지 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 3 | `e2e/overview-summary-cards.spec.ts` | `**/api/**` (지연 후 `continue`) | `LAT` | 로딩 스켈레톤/ARIA 속성 관측을 위해 응답 지연 주입 필요. 실 응답은 즉시 완료돼 스켈레톤 상태를 잡을 수 없음. 핸들러는 테스트 말미 `page.unroute`로 해제. |
| 4 | `e2e/workloads-restart-confirm.spec.ts` | `**/api/deployments/**/restart` (지연 후 200) | `LAT` | "Restarting…" 전이 상태 관측을 위해 응답 지연 필요. 실 restart는 즉시 완료돼 관측 불가하며, 실 재시작은 파괴적이라 실행하지 않음. |
| 5 | `e2e/fluxcd-detail.spec.ts` | `**/api/fluxcd/gitrepositories/dashboard-test/flux-system` (GET, 첫 호출 500) | `ERR` | GitRepository 상세 조회 실패 시 ErrorRetry·재시도 UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음(재시도는 실 fixture로 통과). |
| 6 | `e2e/fluxcd-detail.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/app-ready**` (GET, 첫 호출 500) | `ERR` | Kustomization 상세 조회 실패 시 ErrorRetry·재시도 UI 검증. 동일 사유(재시도는 실 fixture app-ready로 통과). |
| 7 | `e2e/fluxcd-data-states.spec.ts` | `**/api/fluxcd/gitrepositories**` (GET, 첫 호출 500) | `ERR` | GitRepository 목록 조회 실패 시 ErrorRetry·재시도 UI 검증. 실클러스터가 요청 시점에 실패하도록 만들 수 없음(재시도는 continue). |
| 8 | `e2e/fluxcd-data-states.spec.ts` | `**/api/fluxcd/gitrepositories**` (GET, 지연 후 continue) | `LAT` | GitRepository 목록 로딩 스켈레톤(aria-busy) 관측 위해 응답 지연 주입. 실 응답 즉시 완료로 스켈레톤 관측 불가. |
| 9 | `e2e/fluxcd-data-states.spec.ts` | `**/api/fluxcd/kustomizations**` (GET, 첫 호출 500) | `ERR` | Kustomization 목록 조회 실패 시 ErrorRetry·재시도 UI 검증. 동일 ERR 사유(재시도는 continue). |
| 10 | `e2e/fluxcd-data-states.spec.ts` | `**/api/fluxcd/kustomizations**` (GET, 지연 후 빈 목록 fulfill) | `LAT` | Kustomization 목록 로딩 스켈레톤 관측 위해 응답 지연 주입(본문 미검증, 스켈레톤만 관측). 실 응답 즉시 완료로 관측 불가. |
| 11 | `e2e/fluxcd-data-states.spec.ts` | `**/api/fluxcd/gitrepositories**` (GET, 지연 후 continue) | `LAT` | 같은 로딩 테스트의 병행 GitRepository 호출도 지연시켜 스켈레톤 유지. 실 응답 즉시 완료로 관측 불가. |
| 12 | `e2e/fluxcd-reconcile.spec.ts` | `**/api/fluxcd/gitrepositories/dashboard-test/git-repo-mut/reconcile` (POST, 지연 후 continue) | `LAT` | 'Reconciling…' 전이(스피너·버튼 비활성) 관측 위해 응답 지연 후 실 backend로 continue(전용 픽스처 `git-repo-mut`). 실 응답은 즉시 완료돼 전이 상태를 잡을 수 없음. |
| 13 | `e2e/fluxcd-reconcile.spec.ts` | `**/api/fluxcd/gitrepositories/dashboard-test/git-repo-mut/reconcile` (POST, 500) | `ERR` | GitRepository reconcile 실패 시 에러 메시지 UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 14 | `e2e/fluxcd-reconcile.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-reconcile/reconcile` (POST, 지연 후 continue) | `LAT` | 'Reconciling…' 전이 관측 위해 응답 지연 후 실 backend로 continue(전용 픽스처 `kust-mut-reconcile`). 실 응답은 즉시 완료돼 관측 불가. |
| 15 | `e2e/fluxcd-reconcile.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-reconcile/reconcile` (POST, 500) | `ERR` | Kustomization reconcile 실패 시 에러 메시지 UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 16 | `e2e/fluxcd-suspend-resume.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend` (POST, 지연 후 continue) | `LAT` | 'Suspending…' 전이 관측 위해 응답 지연 후 실 backend로 continue(전용 픽스처 `kust-mut-suspend`, 테스트 말미 cleanup으로 resume). 실 응답은 즉시 완료돼 관측 불가. |
| 17 | `e2e/fluxcd-suspend-resume.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume` (POST, 지연 후 continue) | `LAT` | 'Resuming…' 전이 관측 위해 응답 지연 후 실 backend로 continue(전용 픽스처 `kust-mut-resume`, cleanup으로 재suspend). 실 응답은 즉시 완료돼 관측 불가. |
| 18 | `e2e/fluxcd-suspend-resume.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend` (POST, 500) | `ERR` | Suspend 실패 시 에러 메시지 UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 19 | `e2e/fluxcd-suspend-resume.spec.ts` | `**/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume` (POST, 500) | `ERR` | Resume 실패 시 에러 메시지 UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 20 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflows**` (GET, 지연 후 빈 목록 fulfill) | `LAT` | Workflow 목록 로딩 스켈레톤 관측 위해 응답 지연 주입(본문 미검증, 스켈레톤만 관측). 실 응답 즉시 완료로 관측 불가. |
| 21 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflows**` (GET, 첫 호출 500) | `ERR` | Workflow 목록 조회 실패 시 ErrorRetry·재시도 검증(플래그 기반, 재시도는 continue로 실 backend). 실클러스터가 요청 시점에 실패하도록 만들 수 없음. |
| 22 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflows/data-processing-running**` (GET, 지연 후 continue) | `LAT` | Workflow 상세 로딩 스켈레톤 관측 위해 응답 지연 후 continue(실 fixture `data-processing-running` 통과). 실 응답 즉시 완료로 관측 불가. |
| 23 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflows/data-processing-running**` (GET, 첫 호출 500) | `ERR` | Workflow 상세 조회 실패 시 ErrorRetry·재시도 검증(재시도는 continue로 실 fixture 통과). 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 24 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflow-templates**` (GET, 지연 후 빈 목록 fulfill) | `LAT` | WorkflowTemplate 목록 로딩 스켈레톤 관측 위해 응답 지연 주입(본문 미검증). 실 응답 즉시 완료로 관측 불가. |
| 25 | `e2e/argo-data-states.spec.ts` | `**/api/argo/workflow-templates**` (GET, 500) | `ERR` | WorkflowTemplate 목록 조회 실패 시 ErrorRetry UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음. |
| 26 | `e2e/external-secrets-data-states.spec.ts` | `**/api/external-secrets**` (GET, 첫 호출 500) | `ERR` | ExternalSecret 목록 조회 실패 시 ErrorRetry·재시도 검증(플래그 기반, 재시도는 continue로 실 backend). 실클러스터가 요청 시점에 실패하도록 만들 수 없음. |
| 27 | `e2e/external-secrets-data-states.spec.ts` | `**/api/external-secrets**` (GET, 지연 후 빈 목록 fulfill) | `LAT` | ExternalSecret 목록 로딩 스켈레톤(aria-busy) 관측 위해 응답 지연 주입(본문 미검증). 실 응답 즉시 완료로 관측 불가. |
| 28 | `e2e/argo-submit.spec.ts` | `**/api/argo/workflow-templates/simple-template/submit` (POST, 첫 호출 500 → 재시도 200 fulfill) | `ERR` | submit 실패 시 에러 뷰·Retry 재시도 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없고, 재시도 성공 응답까지 실 submit으로 흘리면 클러스터에 워크플로가 생성돼 다른 spec을 오염시킴(`DES` 성격). |
| 29 | `e2e/argo-submit.spec.ts` | `**/api/argo/workflow-templates/simple-template/submit` (POST, 지연 후 200 fulfill) | `LAT` | in-flight(확인 버튼 비활성·스피너) 상태 관측 위해 응답 지연 필요. 실 응답 즉시 완료로 관측 불가하며, 실 submit은 워크플로를 생성해 다른 spec을 오염시킴(`DES` 성격). |

## 미판정 인터셉트 (후속 — 허용목록 아님)

**현재 0건.** `e2e/**/*.ts`에 실재하는 인터셉트는 전부 위 허용목록에 등재돼 있고, 허용목록에
고아 등재도 없다 — **등재 29 ↔ 코드 `// mock-exception:` 주석 29로 양방향 1:1이 성립한다.**

이 절은 새 인터셉트가 판정 전에 들어왔을 때를 위한 자리로 남겨 둔다. 판정 기준: 에러·재시도
UI를 위한 500 주입은 `ERR`, 로딩·스켈레톤 관측을 위한 지연 주입은 `LAT`로 **등재**(정당
예외)하고, 목록·개수·상태 조합을 고정하려는 편의 데이터 모킹은 fixture·전용 namespace로
대체해 **제거**한다. 순수 관측용 pass-through 인터셉트(`route.continue`만 하는 요청 카운터
등)는 어느 카테고리에도 들지 않으므로 `page.on('request', …)` 등 비인터셉트 수단으로 대체해
제거한다.

> **판정 이력.** `fluxcd-detail.spec.ts`(ERR ×2)와 `fluxcd-data-states.spec.ts`(ERR ×2·LAT ×3)는
> rct_20260731-0001 슬라이스에서, `fluxcd-reconcile.spec.ts`(LAT ×2·ERR ×2)·
> `fluxcd-suspend-resume.spec.ts`(LAT ×2·ERR ×2)·`argo-data-states.spec.ts`(LAT ×3·ERR ×3)·
> `external-secrets-data-states.spec.ts`(ERR ×1·LAT ×1)·`argo-submit.spec.ts`(ERR ×1·LAT ×1)는
> rct_20260807-0001 슬라이스에서 판정·등재됐다. 같은 슬라이스에서 부당한 인터셉트 5곳도 제거했다 —
> 순수 pass-through 요청 카운터 3곳(`fluxcd-reconcile` ×2 · `fluxcd-suspend-resume` ×1)은
> `page.on('request', …)` 관측으로 대체하고, no-op `continue`-only 라우트 1곳과 편의성 200
> `fulfill` 1곳(`fluxcd-reconcile`)은 삭제해 실 mutation 픽스처(`kust-mut-reconcile`)로 흘려보냈다.
>
> 마지막으로 남아 있던 `e2e/pods-hide-completed.spec.ts`(인터셉트 2)는 **rct_20260807-0002
> 슬라이스에서 제거**됐다. `GET /api/pods/all` 응답 전체를 합성 pod 4건으로 `fulfill` 하던 데이터
> 모킹이라 `ERR`/`LAT`/`ABS`/`DES` 어디에도 들지 않고 명시적 불허에 해당해, 등재가 아니라 제거가
> 유일한 경로였다. PD6의 세 케이스는 서로 배타적인 pod 상태 조합을 요구하므로 조합별 **전용
> namespace 픽스처**(`test/fixtures/pd6-hide-completed-fixtures.yaml`의 `dashboard-pd6-mixed` ·
> `dashboard-pd6-completed` · `dashboard-pd6-running`)를 만들고 spec이 `/pods?namespace=<ns>`로
> deep link 하도록 바꿨다. 이때 `pod-cleanup.spec.ts`의 파괴적 "Cleanup Execution" 테스트가
> `ns` 없이 전역 cleanup을 호출해 새 완료 픽스처를 지우는 문제가 있어, 그 테스트 1건을
> `?namespace=dashboard-test`로 스코프해 삭제 범위를 자기 픽스처로 한정했다.

> 이 섹션은 비규범(informational)이며 허용목록이 아니다. 여기 나열되는 인터셉트는
> 승인된 예외로 간주되지 않으며, 후속 task에서 판정·정리된다.
