# 엔지니어링 노트 (비-AC e2e 계약)

> 이 문서는 **제품 Acceptance Criteria(AC)가 아니지만** 유지할 가치가 있는 엔지니어링 성격의
> e2e 스펙을 등재한다. 여기 등재된 스펙은 `e2e/` **최상위 AC↔스펙 1:1 매칭 집합에서 제외**되며
> (매칭 대상은 `e2e/*.spec.ts` 최상위 파일만), `e2e/eng/` 하위에 둔다. 각 스펙 헤더는 대응
> `ENG-NNN`을 주석으로 명시한다.

## ENG-001 — 디버그 페이지 (인앱 API 진단 UI)

- **성격**: 개발/운영 진단용 디버그 페이지(`/debug`, `DebugToggle`로 진입)의 동작 계약. 제품
  기능(PRD의 AC)이 아니라 엔지니어가 API 호출을 추적·검사하기 위한 내부 도구다. 따라서 PRD에
  AC를 신설하지 않고 엔지니어링 노트로 분류한다(2026-07-12 사용자 결정: 삭제하지 않고 분리·연결).
- **위치**: `e2e/eng/`
- **커버 스펙 (6개)**:
  - `e2e/eng/debug-back-button.spec.ts` — 디버그 페이지 뒤로가기 버튼 렌더링·내비게이션
  - `e2e/eng/debug-context.spec.ts` — DebugContext 토글·API 로깅·메타데이터
  - `e2e/eng/debug-detail-view.spec.ts` — 로그 상세 뷰
  - `e2e/eng/debug-page-layout.spec.ts` — 페이지 레이아웃·엔드포인트 선택·빈 상태
  - `e2e/eng/debug-route.spec.ts` — SPA 라우팅·상세 탭·클립보드 복사·접근성
  - `e2e/eng/debug-toggle.spec.ts` — 디버그 토글 버튼 존재·ON/OFF·스타일·탭 노출·접근성
- **의존 헬퍼**: `e2e/helpers/debug-setup.ts`
- **비고**: 이 스펙들이 검증하는 `/debug`가 향후 제품 기능으로 승격되면, 그때 PRD에 AC를 신설하고
  대응 스펙을 `e2e/` 최상위로 이동해 AC↔스펙 매칭에 편입한다.

## 매칭 모델과의 관계

`tbm_kubernetes-dashboard-ac-e2e` 모델의 정의는 현재 고아 스펙 해소를 "PRD에 AC 신설 또는 스펙
제거"로만 규정한다. 위 ENG 분류(및 `e2e/smoke/`의 인프라 스모크)는 최상위 매칭 스코프상 이미
집합에서 빠지므로 고아로 판정되지 않지만, "비-AC 스펙 범주(ENG·smoke)"를 모델 정의에 명문화하는
최소 개정을 별도로 제안한다(dear-baby 모델의 ENG/스모크 예외 선례와 동형).
