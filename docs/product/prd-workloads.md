# PRD: Workloads 탭

> 디플로이먼트 현황을 보고, 필요 시 롤링 재시작으로 파드를 순환시켜 조치하는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/workloads` (`WorkloadsTab`)

## 달성 가치

- **V1: 클러스터 상태를 한눈에** — 디플로이먼트의 레디 레플리카 현황을 카드로 보여준다. (AC1, AC4)
- **V3: 파드 문제를 앱 안에서 바로 진단·조치** — 디플로이먼트 롤링 재시작으로 문제 파드를 앱 안에서 순환·복구한다. (AC2, AC3)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 디플로이먼트를 스코프한다. (AC1)

## 범위

- **포함**: 디플로이먼트 목록/카드, 롤링 재시작(확인 다이얼로그 포함), 네임스페이스 스코프, 데이터 상태 처리.
- **제외**: StatefulSet/DaemonSet 등 기타 워크로드(현재 디플로이먼트만), 디플로이먼트 상세 페이지(현재 없음).

## Acceptance Criteria

### AC1: 디플로이먼트 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 디플로이먼트를 카드 그리드로 표시한다. "전체" 선택 시 모든 네임스페이스를 포함한다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/deployments?ns={namespace}` 응답이 `DeploymentCard`로 렌더링되고, `namespace` 변경 시 재조회(`useDataFetch` deps `[namespace]`)되는지 확인. (`handlers/deployments.go`)

### AC2: 롤링 재시작 실행
- **설명**: 각 디플로이먼트 카드에서 롤링 재시작을 실행할 수 있고, 실행 중에는 해당 카드가 재시작 중 상태로 표시된다.
- **달성 가치**: V3
- **검증 방법**: `restartDeployment(namespace, name)` 호출 시 백엔드가 롤링 재시작을 트리거하고, 완료 후 목록이 갱신(`refresh`)되는지 확인. (e2e: `e2e/deployment-restart.spec.ts`)

### AC3: 재시작 전 확인 다이얼로그
- **설명**: 재시작 실행 전 `RestartConfirmDialog`로 대상 디플로이먼트 이름·네임스페이스를 보여주고 명시적 확인을 요구한다. 실패 시 다이얼로그에 오류를 표시한다.
- **달성 가치**: V3
- **검증 방법**: `useConfirmAction` 흐름에서 확인 전에는 재시작이 호출되지 않고, 확인 시에만 실행되는지 확인. (`RestartConfirmDialog.tsx`)

### AC4: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 디플로이먼트가 없으면 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
