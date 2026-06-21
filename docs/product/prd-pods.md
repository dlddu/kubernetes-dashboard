# PRD: Pods 탭

> 파드 현황을 보고, 로그·셸·ephemeral 디버그·정리를 앱 안에서 처리하는 진단·조치의 중심 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/pods`, `/pods/*` (`PodsTab`)

## 달성 가치

- **V3: 파드 문제를 앱 안에서 바로 진단·조치** — 로그 조회, 인터랙티브 셸, ephemeral 컨테이너 디버그, 실패 파드 정리를 한 화면에서 처리해 외부 도구 전환을 없앤다. (AC2, AC3, AC4, AC5)
- **V1: 클러스터 상태를 한눈에** — 파드 목록과 상태를 표시한다. (AC1, AC7)
- **V6: 실시간 최신 상태 유지** — 로그 스트리밍과 WebSocket 셸로 실시간 상호작용한다. (AC2, AC3)
- **V7: 네임스페이스 포커스/개인화** — 네임스페이스 스코프와 "완료 숨김" 필터로 관심 파드만 본다. (AC1, AC6)

## 범위

- **포함**: 파드 목록(네임스페이스 스코프), 파드 로그, 셸 실행, ephemeral 디버그 컨테이너, 실패 파드 정리, 완료 파드 숨김 필터.
- **제외**: 워크로드(디플로이먼트) 재시작(→ `prd-workloads.md`), 별도 `/debug` 라우트 페이지의 레이아웃 세부(공통 디버그 컨텍스트는 본 PRD의 디버그 AC에서 다룸).

## Acceptance Criteria

### AC1: 파드 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 모든 파드를 카드로 표시하고, 각 카드에 파드 상태를 보여준다. 목록 상단에 표시 개수를 노출한다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/pods?ns={namespace}` 응답이 `UnhealthyPodCard`로 렌더링되고 `namespace` 변경 시 재조회되는지 확인. (`handlers/pods.go`, e2e: `e2e/pods.spec.ts`)

### AC2: 파드 로그 조회
- **설명**: 파드 카드를 선택하면 로그 패널이 열리고, 해당 파드(컨테이너)의 로그를 실시간으로 보여준다.
- **달성 가치**: V3, V6
- **검증 방법**: `PodLogPanel`이 선택된 파드의 로그를 스트리밍 표시하는지 확인. (`handlers/pods.go` 로그 엔드포인트, e2e: `e2e/pod-logs.spec.ts`)

### AC3: 파드 셸(exec) 실행
- **설명**: 파드 카드에서 셸 실행을 누르면 인터랙티브 터미널 패널이 열리고, WebSocket으로 명령 입출력과 터미널 크기 조정(resize)을 지원한다.
- **달성 가치**: V3, V6
- **검증 방법**: `PodExecPanel`이 WebSocket 세션을 열고 입출력이 동작하는지 확인. (`handlers/pod_exec.go`의 WebSocket·cols/rows, e2e: `e2e/pod-exec.spec.ts`)

### AC4: ephemeral 컨테이너 디버그
- **설명**: 디버그를 선택하면 대상 파드에 ephemeral 디버그 컨테이너를 생성하고, 생성된 컨테이너로 바로 셸을 연다. 권한이 없으면 RBAC 거부 메시지를 표시한다.
- **달성 가치**: V3
- **검증 방법**: `debugPod(namespace, name, request)` 호출 후 생성된 컨테이너로 셸 패널이 열리는지, RBAC 거부 시 안내 메시지가 표시되는지 확인. (`handlers/pod_debug.go`, e2e: `e2e/pod-debug.spec.ts`)

### AC5: 실패 파드 정리(cleanup)
- **설명**: 정리 대상(`succeeded`/`completed`/`failed`/`error`/`oomkilled`) 파드가 있을 때만 "Cleanup Pods (N)" 버튼을 노출하고, 빨강 확인 다이얼로그로 명시적 확인을 받은 뒤 일괄 삭제한다. 일부 삭제 실패 시 실패 개수를 표시하고 목록을 갱신한다.
- **달성 가치**: V3
- **검증 방법**: `cleanupPods(namespace)` 호출과 `ConfirmDialog`(`confirmColor="red"`, "This action cannot be undone") 흐름, 부분 실패 처리(`result.failed`)를 확인. (e2e: `e2e/pod-cleanup.spec.ts`, `e2e/pod-terminating.spec.ts`)

### AC6: 완료 파드 숨김 필터
- **설명**: 완료(`succeeded`/`completed`) 파드가 있을 때 "Hide Completed (N)" 토글을 노출하고, 켜면 완료 파드를 목록에서 숨긴다. 모두 숨겨지면 안내 메시지를 표시한다.
- **달성 가치**: V7
- **검증 방법**: 토글 상태에 따라 `filteredPods`가 완료 상태를 제외하는지, "All pods are completed..." 빈 상태가 표시되는지 확인.

### AC7: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 파드가 없으면 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
