# PRD: 공통 셸 (Common Shell)

> 모든 탭이 공유하는 앱 셸 — 하단 탭 내비게이션, 상단 바, 전역 폴링 인디케이터, 네임스페이스 셀렉터·즐겨찾기·URL 딥링크.
> 특정 탭에 속하지 않는 교차 기능을 모은다. 상위 기준: `docs/product/values.md` · 위치: `App.tsx`, `TopBar`, `BottomTabBar`, `NamespaceSelector`, `PollingIndicator`

## 달성 가치

- **V2: 모바일에서 즉시 운영 대응** — 하단 탭바, 반응형 셸 레이아웃, 터치 친화 인터랙션으로 데스크톱 없이 운영하게 한다. (AC1, AC2, AC3)
- **V7: 네임스페이스 포커스/개인화** — 전역 네임스페이스 셀렉터와 즐겨찾기(영속)로 관심 네임스페이스로 좁히고, 선택을 URL 딥링크로 공유·복원한다. (AC5, AC6, AC7)
- **V6: 실시간 최신 상태 유지** — 전역 폴링 인디케이터가 마지막 갱신 시각·동기화 상태를 항상 노출하고 수동 새로고침을 제공한다. (AC4)
- **V1: 클러스터 상태를 한눈에** — 어느 탭에서든 비정상 파드 배지와 클러스터 연결 상태를 보여준다. (AC2, AC3)

> 각 탭 PRD는 "선택된 네임스페이스로 스코프되는 효과"(V7)를 다루고, 본 PRD는 "네임스페이스를 선택하는 컨트롤과 즐겨찾기·URL 딥링크"(V7)를 다룬다. 폴링도 마찬가지로, 본 PRD는 전역 인디케이터/어피니티를, Overview PRD(OV4·OV5)는 폴링 동작 자체를 다룬다.

## 범위

- **포함**: 하단 탭 내비게이션, 비정상 파드 배지, 상단 바·반응형 레이아웃·클러스터 연결 표시, 전역 폴링 인디케이터, 네임스페이스 셀렉터, 네임스페이스 즐겨찾기, 네임스페이스 URL 딥링크.
- **제외**: 각 탭의 콘텐츠/액션(해당 탭 PRD), 디버그 모드 토글·디버그 페이지(별도 다룸), 개별 탭의 데이터 상태 처리(각 탭 PRD).

## Acceptance Criteria

### AC1: 하단 탭 내비게이션
- **설명**: 8개 탭(Overview/Nodes/Workloads/Pods/Secrets/ExtSecrets/Argo/FluxCD)을 하단 고정 바로 제공한다. 현재 경로에 해당하는 탭을 활성 표시(중첩 경로 포함)하고, 탭이 화면을 넘치면 가로 스크롤하며, 하단 안전 영역(safe-area inset)을 존중한다.
- **달성 가치**: V2
- **검증 방법**: `BottomTabBar`의 탭 클릭 시 라우팅, `isTabActive`(중첩 경로 매칭, `aria-current`), 가로 스크롤, `pb-[env(safe-area-inset-bottom)]` 동작 확인. (e2e: `e2e/bottom-tab-bar.spec.ts`)

### AC2: 비정상 파드 배지
- **설명**: 비정상 파드 수가 1 이상이면 Overview 탭 아이콘에 개수 배지를 표시해, 다른 탭을 보고 있어도 클러스터 이상을 인지시킨다.
- **달성 가치**: V1, V2
- **검증 방법**: `unhealthyPodCount > 0`일 때 `overview-badge`가 개수와 함께 노출되는지 확인(`overviewData.unhealthyPods` 연동).

### AC3: 상단 바 + 반응형 셸
- **설명**: 상단 바에 앱 타이틀과 클러스터 연결 표시를 두고, 모바일에서는 세로, 데스크톱(sm+)에서는 가로로 배치되는 반응형 레이아웃을 제공한다. 앱 전역 컨텍스트(네임스페이스·즐겨찾기·폴링·대시보드)와 라우팅을 구성한다.
- **달성 가치**: V2, V1
- **검증 방법**: `TopBar`의 반응형 클래스(`flex-col sm:flex-row`)와 `ClusterStatus` 표시, `App.tsx`의 프로바이더·라우트 구성 확인.

### AC4: 전역 폴링 인디케이터
- **설명**: 상단 바에 마지막 갱신 시각을 상대 시간("just now"/"N seconds ago"/"N minutes ago", 매초 갱신)으로 표시하고, 전체 정확한 시각을 툴팁으로 제공한다. 동기화 중에는 "Syncing..." 스피너를, 항상 수동 새로고침 버튼을 제공한다(로딩 중 비활성).
- **달성 가치**: V6
- **검증 방법**: `PollingIndicator`의 상대 시간 산출, `syncing-indicator`, `refresh-button` 동작 확인. 접근성: `aria-live="polite"`, `aria-busy`, 새로고침 버튼 최소 44px 터치 타겟. (e2e: `e2e/polling-indicator.spec.ts`)

### AC5: 네임스페이스 셀렉터
- **설명**: 전역 네임스페이스 드롭다운을 제공한다. 네임스페이스 목록을 조회해 "All Namespaces" + 즐겨찾기 + 전체 섹션으로 보여주고, 선택 시 전역 상태를 갱신해 모든 탭에 반영한다. 키보드(Enter/Space 토글, Escape 닫기)와 외부 클릭 닫기를 지원하고, 로딩 스켈레톤·에러 재시도를 처리한다.
- **달성 가치**: V7
- **검증 방법**: `GET /api/namespaces` 조회, `setSelectedNamespace` 전역 반영, `role="combobox"`/`listbox`/`aria-expanded` 접근성, 키보드·외부클릭 동작 확인. (`handlers/namespaces.go`, e2e: `e2e/namespace-filter.spec.ts`, `e2e/namespace-context-integration.spec.ts`)

### AC6: 네임스페이스 즐겨찾기
- **설명**: 각 네임스페이스 옆 별(★/☆) 토글로 즐겨찾기를 추가/해제하고, 즐겨찾기를 드롭다운 상단 "Favorites" 섹션에 고정한다. 즐겨찾기는 브라우저에 영속되어 재방문 시 유지된다.
- **달성 가치**: V7
- **검증 방법**: `toggleFavorite`/`isFavorite` 동작, 즐겨찾기 섹션 분리 표시, `localStorage`(`namespace-favorites`) 영속 확인. 접근성: 토글 `aria-pressed`. (e2e: `e2e/namespace-favorites.spec.ts`)

### AC7: 네임스페이스 URL 딥링크
- **설명**: 선택된 네임스페이스를 kube API server 컨벤션을 따르는 URL 경로 세그먼트(`/namespaces/<이름>/pods` 등)에 반영해, 현재 화면을 공유·북마크할 수 있는 딥링크로 만든다. 해당 URL로 접속하거나 새로고침하면 그 네임스페이스가 선택된 상태로 로드되어 모든 탭의 데이터 스코프에 반영되고, 탭을 이동해도 세그먼트가 URL에 유지된다. 기본값인 "All Namespaces" 선택 시에는 세그먼트를 제거해 URL을 깨끗하게 유지한다. 클러스터 스코프 화면(Nodes·Debug)은 kube 의미론대로 세그먼트 없이 유지하고, FluxCD 상세 페이지는 리소스 자신의 네임스페이스를 `/namespaces/<이름>/fluxcd/kustomization/<이름>` 형태로 경로에 고정한다(전역 필터와 독립적이며, 구 경로 `/fluxcd/<종류>/<네임스페이스>/<이름>`은 새 경로로 리다이렉트). 두 경우 모두 전역 선택 상태는 보존된다.
- **달성 가치**: V7
- **검증 방법**: `NamespaceContext`·`namespacePath` 유틸의 URL 동기화 — 경로 세그먼트로 초기 선택 로드·조회 API 스코프 반영, 선택 변경 시 경로 재작성(all이면 제거), 탭 이동·새로고침 시 유지, 클러스터 스코프 경로 미접두, FluxCD 상세의 리소스 네임스페이스 고정·레거시 리다이렉트 확인. (단위: `NamespaceContext.test.tsx`·`namespacePath.test.ts`, e2e: `e2e/namespace-deeplink.spec.ts`, `e2e/namespace-context-integration.spec.ts`, `e2e/fluxcd-kustomizations.spec.ts`·`e2e/fluxcd-gitrepositories.spec.ts` 상세 진입·딥링크)

---

## 비고

- 본 PRD가 추가되면서 **V2(모바일에서 즉시 운영 대응)** 가 전용 AC(AC1·AC2·AC3)를 갖게 된다(이전에는 전용 AC 없음).
- 디버그 모드 토글/디버그 페이지(`DebugToggle`, `/debug`, `debug-*.spec.ts`)는 본 PRD 범위에서 제외했다. 필요 시 별도 PRD로 다루며, 현재 가치 매핑이 모호하므로(개발자용 진단 도구) 가치 추가 여부를 함께 검토한다.
