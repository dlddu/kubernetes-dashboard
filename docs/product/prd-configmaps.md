# PRD: ConfigMaps 탭

> 컨피그맵을 네임스페이스 단위로 조회하고, 아코디언으로 키/값을 인라인 열람하는 읽기 전용 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/configmaps` (`ConfigMapsTab`)

## 달성 가치

- **V1: 클러스터 상태를 한눈에** — 컨피그맵 목록과 아코디언 기반 키/값 열람으로 애플리케이션 설정 상태를 직접 확인한다. (CF1, CF2)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 컨피그맵을 스코프한다. (CF1)

## 범위

- **포함**: 컨피그맵 목록(네임스페이스 스코프), 아코디언 키/값 인라인 열람(한 번에 하나만 열림), 데이터 상태 처리(로딩/에러/빈).
- **제외**: 컨피그맵 생성/수정/삭제(읽기 전용), 값 마스킹/Reveal(평문 표시), `.BinaryData` 표시(텍스트 `.Data`만), Secrets(→ `prd-secrets.md`).

## Acceptance Criteria

### CF1: 컨피그맵 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 컨피그맵을 목록으로 표시한다. 네임스페이스가 바뀌면 재조회하고 열린 아코디언을 닫는다.
- **달성 가치**: V1, V7
- **검증 방법**: `GET /api/configmaps?ns={namespace}` 응답이 `ConfigMapAccordion` 목록으로 렌더링되고, `namespace` 변경 시 재조회 및 아코디언 초기화되는지 확인. (`handlers/configmaps.go`, e2e: `e2e/configmaps-tab.spec.ts`)

### CF2: 아코디언 키/값 인라인 열람
- **설명**: 각 컨피그맵 항목을 펼치면 키/값을 인라인으로 열람할 수 있으며(마스킹 없음), 한 번에 하나의 아코디언만 열린다. 펼칠 때 `GET /api/configmaps/{ns}/{name}`로 상세를 lazy-fetch한다.
- **달성 가치**: V1
- **검증 방법**: 항목 토글 시 `openAccordionIndex`가 단일 항목만 열도록 동작하고, 값이 `<pre>`로 즉시 표시되며 Copy 버튼이 동작하는지 확인. (`ConfigMapAccordion.tsx`, `ConfigMapKeyValue.tsx`)

### CF3: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 컨피그맵이 없으면 네임스페이스명을 포함한 빈 상태 메시지를 보여준다.
- **달성 가치**: V1
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
