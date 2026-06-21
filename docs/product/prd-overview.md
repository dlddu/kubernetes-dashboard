# PRD: 클러스터 오버뷰 (Cluster Overview)

> 제품의 진입 화면. 운영자가 앱을 열자마자 클러스터 건강 상태를 파악하고, 이상이 있으면 즉시 다음 행동으로 이어가게 한다.
> 상위 기준: `docs/product/values.md`

## 달성 가치

- **V1: 클러스터 상태를 한눈에** — 노드/파드/리소스 사용률 요약과 비정상 파드 미리보기를 한 화면에 모아, 진입 즉시 건강 상태를 인지시킨다. (AC1, AC2, AC3, AC7)
- **V6: 실시간 최신 상태 유지** — 자동 폴링과 수동 새로고침으로 오버뷰가 항상 최신 상태를 반영한다. (AC4, AC5)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 오버뷰를 스코프해, 관심 대상만 본다. (AC6)

## 범위

- **포함**: 오버뷰 탭(`OverviewTab`)의 요약 카드, 비정상 파드 미리보기, 노드 퀵뷰, 폴링/새로고침, 네임스페이스 스코프 반영, 메트릭 부재 시 폴백 표시.
- **제외**: 노드 상세 탭 전체(`NodesTab`), 파드 진단/조치(로그·exec·debug → 별도 PRD: V3), GitOps·시크릿 화면.

## Acceptance Criteria

### AC1: 클러스터 요약 카드 표시
- **설명**: 오버뷰 진입 시 ① 노드 Ready/전체 수, ② 비정상 파드 수, ③ 평균 CPU 사용률, ④ 평균 메모리 사용률을 요약 카드(`SummaryCards`)로 표시한다.
- **달성 가치**: V1
- **검증 방법**: `GET /api/overview` 응답의 `nodes.ready`/`nodes.total`, `unhealthyPods`, `avgCpuPercent`, `avgMemoryPercent`가 각 카드에 렌더링되는지 확인. (`handlers/overview.go`의 `OverviewResponse`)

### AC2: 비정상 파드 미리보기 (최대 3개)
- **설명**: 비정상 상태 파드를 **최대 3개**까지 미리보기로 표시하고, 각 항목에 파드 이름·네임스페이스·상태 배지를 보여준다. 비정상 파드가 없으면 빈 상태를 표시한다.
- **달성 가치**: V1
- **검증 방법**: `unhealthyPodsList`(name/namespace/status) 기반으로 항목당 세 정보가 노출되고 표시 개수가 3개 이하인지 확인. (기존 e2e: `e2e/unhealthy-pod-preview.spec.ts`, 컴포넌트 `UnhealthyPodPreview.tsx`/`UnhealthyPodCard.tsx`)

### AC3: 노드 퀵뷰
- **설명**: 노드별 상태(`Ready`/`NotReady`/`Ready,SchedulingDisabled`), 역할(role), CPU·메모리 사용률(%)을 퀵뷰(`NodeQuickView`)로 표시한다.
- **달성 가치**: V1
- **검증 방법**: `nodesList` 항목(`status`, `role`, `cpuPercent`, `memoryPercent`)이 `NodeCard`에 렌더링되는지 확인. (기존 e2e: `e2e/node-quick-view.spec.ts`)

### AC4: 자동 폴링으로 최신 상태 유지
- **설명**: 오버뷰 데이터는 기본 **10초** 주기로 자동 갱신되고 마지막 갱신 시각을 표시한다. 탭이 화면에 보이지 않으면 폴링을 멈추고, 갱신이 진행 중이면 중복 실행하지 않는다(single-flight). (오버뷰를 항상 최신으로 유지해 V1의 "한눈에"를 시간축으로 보장)
- **달성 가치**: V6
- **검증 방법**: `PollingContext`의 `DEFAULT_INTERVAL = 10000`, 가시성 기반 일시정지(`isVisibleRef`), 로딩 가드(`isLoadingRef`) 동작 확인. 인디케이터 표시는 `PollingIndicator.tsx`. (기존 e2e: `e2e/polling-indicator.spec.ts`)

### AC5: 수동 새로고침
- **설명**: 사용자는 자동 주기를 기다리지 않고 즉시 새로고침할 수 있으며, 새로고침 중에는 로딩 상태가 표시된다.
- **달성 가치**: V6
- **검증 방법**: `usePolling().refresh()` 호출 시 등록된 콜백이 즉시 재실행되고 `isLoading`이 인디케이터에 반영되는지 확인. (`hooks/usePolling.ts`, `contexts/PollingContext.tsx`)

### AC6: 네임스페이스 스코프 반영
- **설명**: 선택된 네임스페이스가 바뀌면 오버뷰(비정상 파드 집계 등)가 해당 네임스페이스 기준으로 **즉시 재조회**된다. "전체" 선택 시 모든 네임스페이스를 집계한다.
- **달성 가치**: V7
- **검증 방법**: `selectedNamespace` 변경 시 `loadDashboard()` 재호출(`OverviewTab` `useEffect`), 백엔드가 `GET /api/overview?ns={namespace}`로 파드를 스코프하는지 확인. (`handlers/overview.go`의 `r.URL.Query().Get("ns")`, 기존 e2e: `e2e/namespace-filter.spec.ts`)

### AC7: 메트릭 서버 부재 시 graceful 표시
- **설명**: metrics-server를 사용할 수 없어도 오버뷰는 정상 렌더링되며, 사용률 수치는 capacity-allocatable 기반 폴백 값으로 표시된다(빈 화면/에러로 떨어지지 않는다).
- **달성 가치**: V1
- **검증 방법**: `getMetricsClientSafe()`가 `nil`을 반환하는 상황에서도 `OverviewResponse`가 생성되고 평균·노드 % 계산이 폴백되는지 확인. (`handlers/client.go`, `handlers/overview.go`)

---

## 비고

- AC2/AC3/AC4/AC6은 코드베이스에 대응 e2e 스펙이 이미 존재한다. 이 PRD의 AC와 그 스펙을 명시적으로 잇는 **테스트 문서(Phase 3)** 는 아직 작성되지 않았다 — `docs/product/doc-tracker.md`의 "미검증 AC" 참고.
- 본 PRD는 V1을 중심으로 V6·V7을 함께 달성한다. V6·V7 단독의 다른 표면(예: 파드 로그 실시간 스트리밍, 네임스페이스 즐겨찾기 관리 화면)은 별도 PRD로 다룬다.
