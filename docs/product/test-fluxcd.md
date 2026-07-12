# 테스트 문서: FluxCD 탭

> `prd-fluxcd.md`의 AC를 검증하는 테스트 문서.
> 상위: `docs/product/values.md` · 대상 PRD: `prd-fluxcd.md`

## 검증 대상 AC
- FX1 GitRepository 목록·요약 · FX2 Kustomization 목록·요약 · FX3 Reconcile · FX4 Kustomization suspend/resume · FX5 GitRepository 브랜치 전환 · FX6 상세 라이브 상태 · FX7 데이터 상태 처리

## 테스트 시나리오

### 시나리오 1: GitRepository 목록·요약
- **사전 조건**: GitRepository 리소스 존재(Ready/NotReady/Suspended 혼재).
- **실행 단계**: `/flux` 진입 → GitRepository 요약 카드(Ready/NotReady/Suspended)와 리소스 카드 확인 → 카드 클릭 시 상세 이동 확인.
- **기대 결과**: 요약 집계가 맞고, 카드에 URL·branch/tag·revision·interval이 표시되며 상세로 이동한다.
- **검증 AC**: FX1
- **자동화**: `e2e/fluxcd-gitrepositories.spec.ts` (FX1 전용)

### 시나리오 2: Kustomization 목록·요약
- **사전 조건**: Kustomization 리소스 존재.
- **실행 단계**: `/flux`에서 Kustomization 요약 카드와 리소스 카드 확인 → 카드 클릭 시 상세 이동 확인.
- **기대 결과**: 요약 집계가 맞고, 카드에 source·revision·interval·lastApplied·path가 표시되며 상세로 이동한다.
- **검증 AC**: FX2
- **자동화**: `e2e/fluxcd-kustomizations.spec.ts` (FX2 전용)

### 시나리오 3: Reconcile 트리거
- **사전 조건**: GitRepository/Kustomization 상세 진입.
- **실행 단계**: reconcile 액션 실행 → 동기화 요청 확인.
- **기대 결과**: 백엔드 reconcile가 호출되고 상태가 갱신된다.
- **검증 AC**: FX3, (V4)
- **자동화**: `e2e/fluxcd-reconcile.spec.ts` (FX3 전용)

### 시나리오 4: Kustomization suspend/resume
- **사전 조건**: Kustomization 상세 진입.
- **실행 단계**: suspend 실행 → 상태 배지 Suspended 반영 확인 → resume 실행 → 복귀 확인.
- **기대 결과**: suspend/resume 토글이 리소스 상태에 반영된다.
- **검증 AC**: FX4, (V4)
- **자동화**: `e2e/fluxcd-suspend-resume.spec.ts` (FX4 전용)

### 시나리오 5: GitRepository 브랜치 전환
- **사전 조건**: GitRepository 상세 진입, 다중 브랜치 존재.
- **실행 단계**: 브랜치 목록 조회 → 추적 브랜치 변경 → 반영 확인.
- **기대 결과**: 브랜치 목록이 조회되고 변경이 적용된다.
- **검증 AC**: FX5, (V4)
- **자동화**: `e2e/fluxcd-branch-switch.spec.ts` (FX5 전용)

### 시나리오 6: 상세 라이브 상태
- **사전 조건**: 상세 페이지 진입.
- **실행 단계**: reconcile 진행 중 상태가 폴링으로 자동 갱신되는지 확인.
- **기대 결과**: 상세에서 동기화/진행 상태가 자동 갱신된다.
- **검증 AC**: FX6, (V6)
- **자동화**: `e2e/fluxcd-detail.spec.ts` (FX6 전용) — 상세 라이브 상태 표시 검증. (라이브 폴링 자동 갱신 직접 검증은 보강 권장.)

### 시나리오 7: 데이터 상태 처리
- **사전 조건**: 두 섹션 각각 로딩/실패/빈 상태.
- **실행 단계**: 각 상태 확인.
- **기대 결과**: 스켈레톤 / 재시도 가능한 에러 / 빈 상태 메시지가 표시된다.
- **검증 AC**: FX7
- **자동화**: `e2e/fluxcd-data-states.spec.ts` (FX7 전용)

## 커버리지 요약
- 자동화 연결됨(전용 스펙 1:1): FX1·FX2·FX3·FX4·FX5·FX6·FX7
- 자동화 공백: 없음
