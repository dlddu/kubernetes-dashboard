# PRD: FluxCD 탭

> FluxCD GitRepository와 Kustomization의 동기화 상태를 보고, reconcile·suspend·브랜치 전환으로 GitOps를 직접 제어하는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/flux` + 상세 `/fluxcd/{kustomization,gitrepository}/:ns/:name` (`FluxCDTab`, 상세 페이지)

## 달성 가치

- **V4: GitOps·reconciliation 직접 제어** — GitRepository/Kustomization reconcile, Kustomization suspend/resume, GitRepository 브랜치 전환을 대시보드에서 트리거한다. (AC3, AC4, AC5)
- **V1: 클러스터 상태를 한눈에** — GitRepository·Kustomization의 Ready/NotReady/Suspended 요약과 리소스 메타데이터를 표시한다. (AC1, AC2)
- **V6: 실시간 최신 상태 유지** — 상세 페이지에서 reconcile 진행 상태를 폴링으로 갱신한다. (AC6)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 스코프한다. (AC1, AC2)

## 범위

- **포함**: GitRepository 목록/요약/카드, Kustomization 목록/요약/카드, 각 상세 페이지의 reconcile·suspend/resume·브랜치 전환, 상세 라이브 상태, 데이터 상태 처리.
- **제외**: HelmRelease·HelmRepository·OCIRepository 등 기타 Flux 리소스(현재 GitRepository/Kustomization만).

## Acceptance Criteria

### AC1: GitRepository 목록·요약 표시 (네임스페이스 스코프)
- **설명**: GitRepository를 Ready/NotReady/Suspended 요약과 함께 카드로 표시한다. 카드는 URL, branch/tag, revision, interval을 보여주고 누르면 상세로 이동한다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/fluxcd/gitrepositories?ns={namespace}` 응답이 `gitrepository-card`로 렌더링되고 요약 집계가 맞는지 확인. (`handlers/fluxcd_gitrepositories.go`, e2e: `e2e/fluxcd-gitrepositories.spec.ts`)

### AC2: Kustomization 목록·요약 표시 (네임스페이스 스코프)
- **설명**: Kustomization을 Ready/NotReady/Suspended 요약과 함께 카드로 표시한다. 카드는 source(kind/name), revision, interval, lastApplied, path를 보여주고 누르면 상세로 이동한다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/fluxcd/kustomizations?ns={namespace}` 응답이 `kustomization-card`로 렌더링되는지 확인. (`handlers/fluxcd_kustomizations.go`, e2e: `e2e/fluxcd-kustomizations.spec.ts`)

### AC3: Reconcile 트리거
- **설명**: GitRepository와 Kustomization 상세에서 reconcile를 트리거해 즉시 동기화를 요청할 수 있다.
- **달성 가치**: V4
- **검증 방법**: reconcile 액션이 백엔드 reconcile를 호출하는지 확인. (`handlers/fluxcd_kustomization_reconcile_handler.go`, `handlers/fluxcd_gitrepository_reconcile_handler.go`)

### AC4: Kustomization suspend/resume
- **설명**: Kustomization을 일시중단(suspend)하거나 재개(resume)할 수 있고, 상태 배지에 Suspended가 반영된다.
- **달성 가치**: V4
- **검증 방법**: suspend/resume 액션이 리소스의 suspend 상태를 토글하는지 확인. (`handlers/fluxcd_kustomization_suspend_handler.go`)

### AC5: GitRepository 브랜치 전환
- **설명**: GitRepository 상세에서 사용 가능한 브랜치 목록을 조회하고, 추적 브랜치를 변경할 수 있다.
- **달성 가치**: V4
- **검증 방법**: 브랜치 목록 조회와 변경 액션이 동작하는지 확인. (`handlers/fluxcd_gitrepository_branches_handler.go`, `handlers/fluxcd_gitrepository_update_branch_handler.go`)

### AC6: 상세 라이브 상태
- **설명**: GitRepository/Kustomization 상세에서 동기화·reconcile 진행 상태를 보여주고 폴링으로 자동 갱신한다.
- **달성 가치**: V1, V6
- **검증 방법**: `KustomizationDetailPage`/`GitRepositoryDetailPage`가 폴링으로 상태를 갱신하는지 확인. (`handlers/fluxcd_kustomization_detail_handler.go`, `handlers/fluxcd_gitrepository_detail_handler.go`)

### AC7: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 각 섹션에서 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 항목이 없으면 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: 두 섹션의 `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
