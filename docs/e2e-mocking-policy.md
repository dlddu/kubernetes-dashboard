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

## 미판정 인터셉트 (후속 — 허용목록 아님)

아래 파일들의 인터셉트는 **아직 판정되지 않았다**(등재 아님 = 현재 정책상 drift). 후속
reconciler slice가 카테고리별로 판정해 (해당하면) 등재+주석하거나, 아니면 fixture·전용
namespace로 대체해 **제거**한다. 편의 데이터 모킹(예: `pods-hide-completed`가 파드 목록
전체 `fulfill`, `*-data-states`가 목록·상태 조합 고정)은 제거 대상이다.

| 파일 | 인터셉트 호출 수 |
|------|:---------------:|
| `e2e/fluxcd-reconcile.spec.ts` | 16 |
| `e2e/argo-data-states.spec.ts` | 14 |
| `e2e/fluxcd-suspend-resume.spec.ts` | 12 |
| `e2e/fluxcd-data-states.spec.ts` | 12 |
| `e2e/fluxcd-detail.spec.ts` | 6 |
| `e2e/external-secrets-data-states.spec.ts` | 5 |
| `e2e/argo-submit.spec.ts` | 5 |
| `e2e/pods-hide-completed.spec.ts` | 2 |

> 이 섹션은 비규범(informational)이며 허용목록이 아니다. 여기 나열된 인터셉트는
> 승인된 예외로 간주되지 않으며, 후속 task에서 판정·정리된다.
