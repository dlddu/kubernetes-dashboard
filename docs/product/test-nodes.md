# 테스트 문서: Nodes 탭

> `prd-nodes.md`의 AC를 검증하는 테스트 문서.
> 상위: `docs/product/values.md` · 대상 PRD: `prd-nodes.md`

## 검증 대상 AC
- ND1 노드 목록 표시 · ND2 노드 상태·역할·사용률 표시 · ND3 데이터 상태 처리

## 테스트 시나리오

### 시나리오 1: 노드 목록 표시
- **사전 조건**: 클러스터에 노드가 1개 이상 존재.
- **실행 단계**: `/nodes`로 이동 → 노드 카드 그리드 확인.
- **기대 결과**: 모든 노드가 카드로 표시되고 각 카드에 노드 이름이 보인다.
- **검증 AC**: ND1
- **자동화**: `e2e/nodes-tab.spec.ts` (Basic Rendering)

### 시나리오 2: 노드 카드 상태·사용률 표시
- **사전 조건**: 노드 존재(Ready 포함).
- **실행 단계**: 각 노드 카드의 상태 배지·CPU/메모리 사용률 바·파드 수 확인.
- **기대 결과**: StatusBadge(노드 상태), CPU/메모리 사용률 바, 파드 수가 표시되고 사용률 바에 접근성 속성(aria-label)이 있다.
- **검증 AC**: ND2
- **자동화**: `e2e/nodes-tab.spec.ts` (NodeCard Components / UsageBar Accessibility / Ready Node Status)

### 시나리오 3: 데이터 상태 처리
- **사전 조건**: 로딩/실패/빈 상태.
- **실행 단계**: 각 상태 확인.
- **기대 결과**: 스켈레톤 / 재시도 가능한 에러 / 빈 상태 메시지가 표시된다.
- **검증 AC**: ND3
- **자동화**: `e2e/nodes-tab.spec.ts`, `e2e/common-ui-components.spec.ts`

## 커버리지 요약
- 자동화 연결됨: ND1·ND2·ND3
- 자동화 공백: 없음
