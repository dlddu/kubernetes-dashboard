# PRD: Argo Workflows 탭

> 워크플로우 템플릿을 보고 제출하며, 실행된 워크플로우의 상태를 추적·재제출·삭제하는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/argo/*` (`ArgoTab`)

## 달성 가치

- **V4: GitOps 워크플로우 직접 제어** — 템플릿에서 워크플로우를 제출하고, 실행된 워크플로우를 재제출·삭제한다. (AC2, AC5, AC6)
- **V1: 클러스터 상태를 한눈에** — 템플릿·워크플로우 목록과 실행 상태를 표시한다. (AC1, AC3)
- **V6: 실시간 최신 상태 유지** — 워크플로우 상세에서 실행 상태를 폴링으로 갱신한다. (AC4)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 스코프한다. (AC1)

## 범위

- **포함**: 워크플로우 템플릿 목록, 템플릿에서 워크플로우 제출(SubmitModal), 템플릿별 실행 워크플로우 목록, 워크플로우 상세(라이브 상태), 재제출, 삭제.
- **제외**: 템플릿 생성/편집(현재 없음), 크론 워크플로우.

## Acceptance Criteria

### AC1: 워크플로우 템플릿 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 워크플로우 템플릿을 카드로 표시하고, 카드를 누르면 해당 템플릿의 워크플로우 목록으로 이동한다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/argo/templates?ns={namespace}` 응답이 `WorkflowTemplateCard`로 렌더링되고 라우팅이 동작하는지 확인. (`handlers/argo_templates.go`, e2e: `e2e/argo-templates.spec.ts`)

### AC2: 템플릿에서 워크플로우 제출
- **설명**: 템플릿 카드의 제출을 누르면 `SubmitModal`이 열리고, 파라미터를 입력해 워크플로우를 제출할 수 있다. 제출 후 해당 템플릿의 워크플로우 목록으로 이동한다.
- **달성 가치**: V4
- **검증 방법**: 제출 시 백엔드가 워크플로우를 생성하고 목록으로 네비게이션되는지 확인. (`handlers/argo_workflows_handler.go`, e2e: `e2e/argo-submit.spec.ts`)

### AC3: 실행 워크플로우 목록·상태 표시
- **설명**: 템플릿별로 실행된 워크플로우 목록과 각 워크플로우의 단계/상태(Running/Succeeded/Failed 등)를 표시한다.
- **달성 가치**: V1
- **검증 방법**: `ArgoWorkflowsPage`가 워크플로우 목록과 상태를 렌더링하는지 확인. (`handlers/argo_workflows.go`, e2e: `e2e/argo-workflows.spec.ts`)

### AC4: 워크플로우 상세 라이브 상태
- **설명**: 워크플로우 상세에서 노드/단계별 진행 상태를 보여주고, 실행 중에는 폴링으로 상태를 자동 갱신한다.
- **달성 가치**: V1, V6
- **검증 방법**: `ArgoWorkflowDetailPage`/`WorkflowDetail`이 폴링으로 상태를 갱신하는지 확인. (`handlers/argo_workflow_detail_handler.go`, e2e: `e2e/argo-workflow-detail.spec.ts`)

### AC5: 워크플로우 재제출
- **설명**: 실행된 워크플로우를 동일 설정으로 재제출할 수 있다.
- **달성 가치**: V4
- **검증 방법**: 재제출 액션이 새 워크플로우를 생성하는지 확인. (e2e: `e2e/argo-workflow-resubmit.spec.ts`)

### AC6: 워크플로우 삭제
- **설명**: 실행된 워크플로우를 삭제할 수 있다(워크플로우 수명주기 제어의 일부).
- **달성 가치**: V4
- **검증 방법**: 삭제 액션이 대상 워크플로우를 제거하고 목록을 갱신하는지 확인. (e2e: `e2e/argo-workflow-delete.spec.ts`)

### AC7: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 항목이 없으면 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
