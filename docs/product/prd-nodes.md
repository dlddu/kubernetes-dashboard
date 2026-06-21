# PRD: Nodes 탭

> 클러스터 노드의 상태와 자원 사용률을 노드 단위로 보여주는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/nodes` (`NodesTab`)

## 달성 가치

- **V1: 클러스터 상태를 한눈에** — 노드별 Ready 상태·역할·CPU/메모리 사용률을 카드로 모아, 클러스터 인프라 계층의 건강 상태를 파악시킨다. (AC1, AC2, AC3)

> 노드는 클러스터 스코프 리소스이므로 V7(네임스페이스 포커스)은 적용하지 않는다. 이 탭은 폴링/스트리밍을 쓰지 않으므로 V6도 적용하지 않는다(수동 새로고침만 제공).

## 범위

- **포함**: 노드 목록 조회, 노드 카드(상태·역할·사용률), 데이터 상태 처리.
- **제외**: 오버뷰의 노드 퀵뷰(→ `prd-overview.md` AC3), 노드 드릴다운 상세 페이지(현재 없음).

## Acceptance Criteria

### AC1: 노드 목록 표시
- **설명**: `/nodes` 진입 시 클러스터의 모든 노드를 카드 그리드로 표시한다.
- **달성 가치**: V1
- **검증 방법**: `GET /api/nodes` 응답의 각 노드가 `NodeCard`로 렌더링되는지 확인. (`handlers/nodes.go`, e2e: `e2e/nodes-tab.spec.ts`)

### AC2: 노드 상태·역할·사용률 표시
- **설명**: 각 노드 카드는 상태(`Ready`/`NotReady`/`Ready,SchedulingDisabled`), 역할(control-plane/worker 등), CPU·메모리 사용률(%)을 표시한다.
- **달성 가치**: V1
- **검증 방법**: `node_utils.go`의 상태·사용률 산출 결과가 카드에 반영되는지 확인. (컴포넌트 `NodeCard.tsx`, 단위 `NodeCard.test.tsx`)

### AC3: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 조회 실패 시 재시도 버튼이 있는 에러 표시, 노드가 없으면 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: `useDataFetch`의 `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState`가 노출되는지 확인. (e2e: `e2e/common-ui-components.spec.ts`)
