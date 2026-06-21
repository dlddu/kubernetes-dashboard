# 테스트 문서: Argo Workflows 탭

> `prd-argo.md`의 AC를 검증하는 테스트 문서.
> 상위: `docs/product/values.md` · 대상 PRD: `prd-argo.md`

## 검증 대상 AC
- AR1 템플릿 목록(네임스페이스 스코프) · AR2 템플릿에서 워크플로우 제출 · AR3 실행 워크플로우 목록·상태 · AR4 워크플로우 상세 라이브 상태 · AR5 재제출 · AR6 삭제 · AR7 데이터 상태 처리

## 테스트 시나리오

### 시나리오 1: 워크플로우 템플릿 목록·네임스페이스 스코프
- **사전 조건**: 워크플로우 템플릿 존재.
- **실행 단계**: `/argo` 진입(기본 Templates) → 카드(이름·네임스페이스·파라미터 태그) 확인 → 네임스페이스 필터 적용 확인.
- **기대 결과**: 템플릿 카드가 표시되고, 파라미터 없으면 "No parameters", 선택 네임스페이스로 스코프된다.
- **검증 AC**: AR1
- **자동화**: `e2e/argo-templates.spec.ts`

### 시나리오 2: 템플릿에서 워크플로우 제출
- **사전 조건**: 템플릿(파라미터/enum 포함, 무파라미터 각각) 존재.
- **실행 단계**: Submit 클릭 → SubmitModal 기본값 프리필 확인 → enum은 select로 표시 → 파라미터 편집 후 제출 → 성공 뷰 → "View Workflow"로 워크플로우 목록 이동.
- **기대 결과**: 제출이 워크플로우를 생성하고 목록으로 이동한다. 무파라미터는 폼 없이 제출 가능.
- **검증 AC**: AR2, (V4)
- **자동화**: `e2e/argo-submit.spec.ts` (Happy Path / Error & Loading / Modal Dismissal / View Workflow)

### 시나리오 3: 실행 워크플로우 목록·상태
- **사전 조건**: 실행된 워크플로우 존재(Running/Succeeded/Failed 혼재).
- **실행 단계**: Workflows 섹션 전환 → 카드(이름·phase 배지·템플릿명·시작시간·스텝 미리보기) 확인 → phase 색상·스텝 미리보기 확인 → 네임스페이스/templateName 필터 확인.
- **기대 결과**: 워크플로우 목록과 phase별 색상(Running=blue, Succeeded=green, Failed=red), 스텝 미리보기가 표시된다.
- **검증 AC**: AR3
- **자동화**: `e2e/argo-workflows.spec.ts`

### 시나리오 4: 워크플로우 상세 (라이브 상태)
- **사전 조건**: 워크플로우 존재.
- **실행 단계**: 워크플로우 카드 클릭 → 상세 헤더(이름·phase·시작/종료) → Parameters 토글 → Steps 타임라인 → Inputs/Outputs 패널 확인. 실행 중 상태가 갱신되는지 확인.
- **기대 결과**: 상세 정보가 표시되고 단계별 상태/IO가 노출된다.
- **검증 AC**: AR4, (V6)
- **자동화**: `e2e/argo-workflow-detail.spec.ts` (Navigation / Header / Parameters / Steps / IO) — 단, **라이브 폴링 자동 갱신** 직접 검증은 보강 권장.

### 시나리오 5: 워크플로우 재제출
- **사전 조건**: Succeeded/Failed 워크플로우 존재.
- **실행 단계**: 상세에서 Resubmit → 확인 다이얼로그(이름·네임스페이스, Escape/Cancel) → 확인 → 재제출 실행.
- **기대 결과**: 확인 후 동일 설정으로 새 워크플로우가 생성된다.
- **검증 AC**: AR5, (V4)
- **자동화**: `e2e/argo-workflow-resubmit.spec.ts` (Button Visibility / Confirmation Dialog / Execution / Accessibility)

### 시나리오 6: 워크플로우 삭제
- **사전 조건**: 워크플로우 존재.
- **실행 단계**: 상세에서 Delete → 확인 다이얼로그(이름·네임스페이스, 되돌릴 수 없음 경고) → 확인 → 삭제.
- **기대 결과**: 확인 후 워크플로우가 삭제된다.
- **검증 AC**: AR6, (V4)
- **자동화**: `e2e/argo-workflow-delete.spec.ts` (Button Visibility / Confirmation Dialog / Accessibility)

### 시나리오 7: 데이터 상태 처리
- **사전 조건**: 로딩/실패/빈 상태.
- **실행 단계**: 템플릿·워크플로우 각 목록에서 상태 확인.
- **기대 결과**: 스켈레톤 / 재시도 가능한 에러 / 빈 상태 메시지가 표시된다.
- **검증 AC**: AR7
- **자동화**: `e2e/argo-templates.spec.ts`, `e2e/argo-workflows.spec.ts` (Loading/Empty/Error States)

## 커버리지 요약
- 자동화 연결됨: AR1·AR2·AR3·AR4·AR5·AR6·AR7
- 자동화 공백: 없음 (AR4의 라이브 폴링 자동 갱신만 보강 권장)
