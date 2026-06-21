# kubernetes-dashboard 제품 가치 문서

> 이 문서는 모든 하위 문서(PRD, Acceptance Criteria, 테스트 문서)의 **최우선 판단 기준**이다.
> 어떤 문서를 작성하든 "이 문서가 어떤 가치에 기여하는가?"를 이 문서를 기준으로 판단한다.

## 제품 소유자

- **클러스터 운영자** — 이 제품이 제공할 가치를 정의하고 우선순위를 책임진다.

## 제품 가치

### V1: 클러스터 상태를 한눈에
- **유형**: 추상적
- **설명**: 메인 오버뷰에서 노드 Ready 수, 비정상 파드 수와 목록, 평균 CPU/메모리 사용률을 한 화면에 집계해, 운영자가 클러스터의 건강 상태를 즉시 인지하게 한다.
- **근거(코드)**: `handlers/overview.go`(`OverviewHandler`), `frontend/src/components/OverviewTab.tsx`, `ClusterStatus.tsx`, `UnhealthyPodPreview.tsx`

### V2: 모바일에서 즉시 운영 대응
- **유형**: 추상적
- **설명**: 하단 탭바 기반의 모바일 친화 UI로, 데스크톱 없이 이동 중에도 클러스터를 확인하고 조치할 수 있게 한다.
- **근거(코드)**: `frontend/src/components/BottomTabBar.tsx`, `TopBar.tsx`, 모바일 우선 레이아웃

### V3: 파드 문제를 앱 안에서 바로 진단·조치
- **유형**: 추상적
- **설명**: 로그 조회, 인터랙티브 셸 실행, ephemeral 컨테이너 디버그, 파드 정리(cleanup)를 한 흐름에서 처리해 외부 도구로의 컨텍스트 전환을 최소화한다.
- **근거(코드)**: `handlers/pods.go`, `pod_exec.go`, `pod_debug.go`, `frontend/src/components/DebugPage.tsx`, `PodLogPanel.tsx`

### V4: GitOps 워크플로우 직접 제어
- **유형**: 추상적
- **설명**: FluxCD Kustomization/GitRepository의 reconcile·suspend·resume, GitRepository 브랜치 업데이트, Argo Workflow 템플릿 제출·재제출을 대시보드에서 직접 트리거한다.
- **근거(코드)**: `handlers/fluxcd_*`, `handlers/argo_*`, `frontend/src/components/FluxCDTab.tsx`, `ArgoWorkflowsPage.tsx`

### V5: 민감 리소스 안전 열람
- **유형**: 추상적
- **설명**: Secret과 External Secrets Operator 리소스를 통제된 방식으로 조회해, 운영에 필요한 시크릿 정보를 확인하게 한다.
- **근거(코드)**: `handlers/secrets.go`, `external_secrets.go`, `frontend/src/components/SecretsTab.tsx`, `ExternalSecretsTab.tsx`

### V6: 실시간 최신 상태 유지
- **유형**: 추상적
- **설명**: 자동 폴링 인디케이터와 WebSocket 기반 라이브 터미널·로그로, 수동 새로고침 없이 항상 최신 상태를 보게 한다. (V1이 "한눈에"라면 V6은 "계속 최신")
- **근거(코드)**: `e2e/polling-indicator.spec.ts`, `handlers/pod_exec.go`(WebSocket, 터미널 resize)

### V7: 네임스페이스 포커스/개인화
- **유형**: 추상적
- **설명**: 네임스페이스 즐겨찾기와 필터로 다수의 네임스페이스 중 관심 대상만 빠르게 좁혀, 노이즈를 줄이고 운영 효율을 높인다.
- **근거(코드)**: `e2e/namespace-favorites.spec.ts`, `e2e/namespace-filter.spec.ts`, `frontend/src/components/NamespaceSelector.tsx`

---

## 메모

- **접근성**(`aria-live`, `role="alert"` 등)은 독립 가치가 아닌, 각 AC의 **품질 기준(검증 방법)**에 녹여 다룬다.
- 후보로 탐색했으나 이번 범위에서 제외한 가치: **파괴적 작업의 안전장치**(`ConfirmDialog`/`RestartConfirmDialog` 등), **부분 장애에도 견고한 동작**(`getMetricsClientSafe` 폴백, `ErrorRetry`). 향후 필요 시 V8 이후로 추가 가능.
