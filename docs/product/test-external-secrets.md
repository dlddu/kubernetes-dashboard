# 테스트 문서: External Secrets 탭

> `prd-external-secrets.md`의 AC를 검증하는 테스트 문서.
> 상위: `docs/product/values.md` · 대상 PRD: `prd-external-secrets.md`

## 검증 대상 AC
- ES1 ExternalSecret 목록(네임스페이스 스코프) · ES2 동기화 상태 요약 카드 · ES3 카드별 상태·설정·실패 사유 · ES4 데이터 상태 처리

## 테스트 시나리오

### 시나리오 1: ExternalSecret 목록·네임스페이스 스코프
- **사전 조건**: 테스트 네임스페이스에 ExternalSecret 존재.
- **실행 단계**: `/external-secrets`로 이동 → 카드 목록 확인 → 네임스페이스 변경 시 해당 네임스페이스만 표시 확인.
- **기대 결과**: 선택 네임스페이스의 ExternalSecret만 카드로 표시된다.
- **검증 AC**: ES1
- **자동화**: `e2e/external-secrets.spec.ts` (Basic Rendering / Namespace Filtering)

### 시나리오 2: 동기화 상태 요약 카드
- **사전 조건**: Ready/NotReady 혼재.
- **실행 단계**: 상단 Total/Ready/Not Ready 요약 카드 값 확인.
- **기대 결과**: 각 요약 카드가 정확한 개수를 표시한다.
- **검증 AC**: ES2
- **자동화**: `e2e/external-secrets.spec.ts` (Summary Cards)

### 시나리오 3: 카드별 상태·설정·실패 사유
- **사전 조건**: 정상 ES와 실패(NotReady) ES 각각 존재.
- **실행 단계**: 카드의 상태 배지·store·target·refresh interval 확인 → NotReady 카드의 실패 사유(reason/message) 확인.
- **기대 결과**: 설정 메타데이터가 표시되고, 실패 시 사유가 노출된다.
- **검증 AC**: ES3
- **자동화**: `e2e/external-secrets.spec.ts` (Basic Rendering: 카드 필드 / NotReady 사유)

### 시나리오 4: 데이터 상태 처리
- **사전 조건**: 로딩/실패/빈 상태.
- **실행 단계**: 각 상태 확인.
- **기대 결과**: 스켈레톤(aria-busy) / 재시도 가능한 에러 / 네임스페이스명을 포함한 빈 상태 메시지가 표시된다.
- **검증 AC**: ES4
- **자동화**: `e2e/external-secrets.spec.ts` (Empty, Error & Loading States)

## 커버리지 요약
- 자동화 연결됨: ES1·ES2·ES3·ES4
- 자동화 공백: 없음
