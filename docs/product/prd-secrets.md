# PRD: Secrets 탭

> 시크릿을 네임스페이스 단위로 조회하고, 아코디언으로 키/값을 안전하게 열람하는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/secrets` (`SecretsTab`)

## 달성 가치

- **V5: 민감 리소스 안전 열람** — 시크릿 목록과 아코디언 기반 키/값 열람을 제공한다. (AC1, AC2)
- **V4: GitOps·reconciliation 직접 제어** — ESO가 관리하는 대상 Secret 삭제를 통해 External Secret의 강제 재동기화(reconcile)를 유도한다. (AC3)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 시크릿을 스코프한다. (AC1)

## 범위

- **포함**: 시크릿 목록(네임스페이스 스코프), 아코디언 키/값 열람(한 번에 하나만 열림), 대상 Secret 삭제를 통한 External Secret 재동기화 유도(확인 다이얼로그), 데이터 상태 처리.
- **제외**: 시크릿 생성/수정(현재 없음), External Secrets(→ `prd-external-secrets.md`).

## Acceptance Criteria

### AC1: 시크릿 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 시크릿을 목록으로 표시한다. 네임스페이스가 바뀌면 재조회하고 열린 아코디언을 닫는다.
- **달성 가치**: V5, V7
- **검증 방법**: `GET /api/secrets?ns={namespace}` 응답이 `SecretAccordion` 목록으로 렌더링되고, `namespace` 변경 시 재조회 및 아코디언 초기화되는지 확인. (`handlers/secrets.go`, e2e: `e2e/secrets-tab.spec.ts`)

### AC2: 아코디언 키/값 열람
- **설명**: 각 시크릿 항목을 펼치면 키/값을 열람할 수 있으며, 한 번에 하나의 아코디언만 열린다.
- **달성 가치**: V5
- **검증 방법**: 항목 토글 시 `openAccordionIndex`가 단일 항목만 열도록 동작하는지 확인. (`SecretAccordion.tsx`)

### AC3: External Secret 재동기화 유도 (대상 Secret 삭제)
- **설명**: ESO(External Secrets Operator)가 관리하는 대상 Secret을 삭제하면, ESO가 이를 감지해 외부 저장소에서 해당 Secret을 재동기화(reconcile)한다. 이 기능의 주 용도는 **외부 시크릿 값을 강제로 새로 받아오기 위한 재동기화 트리거**다. 삭제 실행 전 `DeleteConfirmDialog`로 대상 이름·네임스페이스를 보여주고 명시적 확인을 받는다.
- **달성 가치**: V4 (ESO 대상 Secret 삭제 → External Secret 강제 재동기화)
- **검증 방법**: `deleteSecret(namespace, name)` 호출과 확인 다이얼로그 흐름, 그리고 ESO 관리 대상 Secret 삭제 시 재동기화로 Secret이 재생성되는지 확인. (`handlers/secrets.go`, 자동화 e2e 신규 필요)
- **참고**: External Secret의 현재 상태/동기화 정보 열람은 `prd-external-secrets.md`(ES 탭)에서 다룬다. 본 AC는 그 재동기화를 **유도**하는 액션이다.

### AC4: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 시크릿이 없으면 네임스페이스명을 포함한 빈 상태 메시지를 보여준다.
- **달성 가치**: V5
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
