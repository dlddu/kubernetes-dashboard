# PRD: External Secrets 탭

> External Secrets Operator(ESO) 리소스의 동기화 상태와 설정을 조회하는 화면.
> 상위 기준: `docs/product/values.md` · 탭 경로: `/external-secrets` (`ExternalSecretsTab`)

## 달성 가치

- **V5: 민감 리소스 안전 열람** — ExternalSecret의 동기화 상태(Ready/NotReady), 저장소·타겟·동기화 주기·최신 동기화 시각 등 민감 리소스 메타데이터를 읽기 전용으로 열람한다. (AC1, AC2, AC3)
- **V7: 네임스페이스 포커스/개인화** — 선택된 네임스페이스 기준으로 스코프한다. (AC1)

> 이 탭은 읽기 전용이며 폴링/스트리밍을 쓰지 않으므로 V6은 적용하지 않는다.

## 범위

- **포함**: ExternalSecret 목록(네임스페이스 스코프), Total/Ready/NotReady 요약, 카드별 동기화 상태·설정·실패 사유 표시, 데이터 상태 처리.
- **제외**: SecretStore/ClusterSecretStore 관리, ExternalSecret 생성/수정/강제 동기화(현재 없음).

## Acceptance Criteria

### AC1: ExternalSecret 목록 표시 (네임스페이스 스코프)
- **설명**: 선택된 네임스페이스의 ExternalSecret을 카드로 표시하고, `namespace` 변경 시 재조회한다.
- **달성 가치**: V5, V7
- **검증 방법**: `GET /api/external-secrets?ns={namespace}` 응답이 `external-secret-card`로 렌더링되는지 확인. (`handlers/external_secrets.go`, e2e: `e2e/external-secrets.spec.ts`)

### AC2: 동기화 상태 요약 카드
- **설명**: 상단에 Total / Ready / Not Ready 개수를 요약 카드로 표시한다.
- **달성 가치**: V5
- **검증 방법**: `ready` 플래그로 집계한 `readyCount`/`notReadyCount`가 요약 카드에 반영되는지 확인.

### AC3: 카드별 상태·설정·실패 사유 표시
- **설명**: 각 카드는 상태 배지, 네임스페이스, 저장소(storeKind/storeName), 타겟, 동기화 주기, 최신 동기화 시각을 표시하고, NotReady인 경우 실패 사유(reason/message)를 표시한다.
- **달성 가치**: V5
- **검증 방법**: ESO 리소스 필드(`storeKind`, `targetName`, `refreshInterval`, `lastSyncTime`, `reason`)가 카드에 조건부로 렌더링되는지 확인.

### AC4: 데이터 상태 처리 (로딩·에러·빈 상태)
- **설명**: 최초 로딩 시 스켈레톤, 실패 시 재시도 가능한 에러 표시, 항목이 없으면 네임스페이스명을 포함한 빈 상태 메시지를 보여준다.
- **달성 가치**: V5
- **검증 방법**: `isLoading`/`error`/빈 배열 분기에서 `LoadingSkeleton`/`ErrorRetry`/`EmptyState` 노출 확인.
