# kubernetes-dashboard 문서 체계 상태 추적

> 이 문서는 제품 문서 체계의 **현재 상태와 연결 관계**를 기록·추적·진단한다.
> 문서를 생성하거나 수정할 때마다 이 문서를 함께 갱신한다.

## 현재 상태 요약

- 정의된 가치: **7개** (V1~V7) — 소유자: 클러스터 운영자
- PRD: **10개** (탭별 9개 + 공통 셸 1개)
- Acceptance Criteria: **53개** (가치 연결됨: 53 / 미연결: 0)
- 테스트 문서: **10개** (AC 커버됨: 53 / 미커버: 0)
- **건강 상태**: 🟢 **건강함** — 가치→PRD→AC→테스트 문서가 모두 연결됨(7개 조건 충족). e2e 매핑을 **AC↔스펙 파일 양방향 1:1**로 재구조화 완료(연결 AC 53 ↔ 전용 최상위 스펙 53, 공유·중복·고아 0). **자동화 공백 0** — 2026-08-07 OV7(메트릭 서버 부재 폴백) 전용 스펙 `e2e/overview-metrics-fallback.spec.ts`를 신설해 마지막 공백을 해소하고 53↔53 전단사를 완성했다. OV7은 CI E2E 매트릭스의 `no-metrics` leg(별도 러너·`INSTALL_METRICS_SERVER=false` kind 클러스터)에서 실환경 폴백을 검증한다(데이터-모킹 없음).

## PRD ↔ 테스트 문서 인덱스

| 코드 | PRD | 위치 | 달성 가치 | AC | 테스트 문서 | 자동화 공백 |
|------|-----|------|-----------|----|-------------|-------------|
| OV | `prd-overview.md` | `/` | V1, V6, V7 | 7 | `test-overview.md` | — |
| ND | `prd-nodes.md` | `/nodes` | V1 | 3 | `test-nodes.md` | — |
| WL | `prd-workloads.md` | `/workloads` | V1, V3, V7 | 4 | `test-workloads.md` | — |
| PD | `prd-pods.md` | `/pods` | V1, V3, V6, V7 | 7 | `test-pods.md` | — |
| SC | `prd-secrets.md` | `/secrets` | V4, V5, V7 | 4 | `test-secrets.md` | — |
| CF | `prd-configmaps.md` | `/configmaps` | V1, V7 | 3 | `test-configmaps.md` | — |
| ES | `prd-external-secrets.md` | `/external-secrets` | V5, V7 | 4 | `test-external-secrets.md` | — |
| AR | `prd-argo.md` | `/argo` | V1, V4, V6, V7 | 7 | `test-argo.md` | (AR4 폴링 보강) |
| FX | `prd-fluxcd.md` | `/flux` | V1, V4, V6, V7 | 7 | `test-fluxcd.md` | — (FX6 폴링 보강 권장) |
| CM | `prd-common.md` | 앱 셸(전역) | V1, V2, V6, V7 | 7 | `test-common.md` | — |

## 가치 커버리지 매트릭스

| 가치 | 커버 PRD | 연결된 AC | 테스트 | 상태 |
|------|----------|-----------|--------|------|
| V1: 클러스터 상태를 한눈에 | OV, ND, WL, PD, AR, FX, CM, CF | OV1·OV2·OV3·OV7, ND1·ND2·ND3, WL1·WL4, PD1·PD7, AR1·AR3·AR4·AR7, FX1·FX2·FX6·FX7, CM2·CM3, CF1·CF2 | ✓ | ✅ 검증(문서) |
| V2: 모바일에서 즉시 운영 대응 | CM | CM1·CM2·CM3 | ✓ | ✅ 검증(문서) |
| V3: 파드 문제를 앱 안에서 진단·조치 | WL, PD | WL2·WL3, PD2·PD3·PD4·PD5 | ✓ | ✅ 검증(문서) |
| V4: GitOps·reconciliation 직접 제어 | AR, FX, SC | AR2·AR5·AR6, FX3·FX4·FX5, SC3 | ✓ | ✅ 검증(문서) |
| V5: 민감 리소스 안전 열람 | SC, ES | SC1·SC2·SC4, ES1·ES2·ES3·ES4 | ✓ | ✅ 검증(문서) |
| V6: 실시간 최신 상태 유지 | OV, PD, AR, FX, CM | OV4·OV5, PD2·PD3, AR4, FX6, CM4 | ✓ | ✅ 검증(문서) |
| V7: 네임스페이스 포커스/개인화 | OV, WL, PD, SC, CF, ES, AR, FX, CM | OV6, WL1, PD1·PD6, SC1, CF1, ES1, AR1, FX1·FX2, CM5·CM6·CM7 | ✓ | ✅ 검증(문서) |

## 위험 진단

### 건강한 문서 체계의 7개 조건 — 모두 충족 ✅
1. 모든 가치에 소유자 있음 ✅ · 2. 모든 문서가 가치 참조 ✅ · 3. 모든 PRD가 가치 달성 ✅ · 4. 모든 PRD에 AC 있음 ✅ · 5. 모든 AC가 가치 달성 ✅ · 6. 모든 AC에 테스트 문서 있음 ✅ · 7. 모든 테스트가 AC 참조 ✅

### 자동화 공백 — 0건 (전단사 완성) 🟢
1:1 재구조화로 FluxCD 상세(FX3~6)를 전용 파일로 승격·연결하고 오버뷰 스코프(OV6)를 공백으로 재분류한 뒤, CM3·PD6·OV6·SC3에 이어 **2026-08-07 OV7 전용 스펙을 신설**해 공백은 8→5→4→3→1→**0**으로 줄어 53↔53 전단사가 완성됐다. 최근 해소분:
- **OV6** ✅ → `e2e/overview-namespace-scope.spec.ts` (실 kind 클러스터에서 네임스페이스 전환 시 `GET /api/overview?ns=` 스코프 재조회를 관측; 모킹 없음)
- **SC3** ✅ → `e2e/secrets-delete-resync.spec.ts` (삭제 확인 다이얼로그→확인 시 **실제 DELETE `/api/secrets/:ns/:name`** 발행 후 대상 아코디언 소멸을 단정. **모킹 없음** — 전용 fixture `secret-mut-delete`(`test/fixtures/secret-mut-fixtures.yaml`, `fluxcd-mut-fixtures.yaml` 격리 선례를 따름)를 실제로 삭제한다. SC1/SC2/SC4는 `test-secret`/`tls-secret`만 testid로 지목하고 `>= 2` 아코디언만 단정하므로 세 번째 전용 fixture 삭제에 무영향. ESO 재동기화 **재생성** 단정은 kind에 ESO 컨트롤러가 없어 하네스 밖 — 앱이 소유한 실삭제까지 검증)
- **OV7** ✅ → `e2e/overview-metrics-fallback.spec.ts` (메트릭 서버 부재 폴백). CI E2E 매트릭스의 `no-metrics` leg가 `INSTALL_METRICS_SERVER=false`로 생성한 전용 kind 클러스터(별도 러너)에서 이 스펙만 실행해 실환경 폴백을 검증한다 — 공유 클러스터/OV1 등 metrics 의존 스펙 무영향, 데이터-모킹 없음(인터셉트 0 → 형제 `tbm_kubernetes-dashboard-e2e-mock-policy` 무drift). 백엔드 폴백 계산은 `handlers/overview_test.go`가 유닛 커버.
- (보강 권장) **FX6** — 상세 라이브 폴링 자동 갱신 직접 검증 · **AR4** — 워크플로우 상세 라이브 폴링

### 비-AC e2e 스펙 분류 (매칭 대상 밖)
`e2e/` 최상위 `*.spec.ts`만 AC↔스펙 매칭 대상이다. 다음 하위 디렉터리는 매칭에서 제외한다:
- `e2e/smoke/health.spec.ts` — 인프라 liveness/readiness 스모크(제품 AC 아님).
- `e2e/eng/debug-*.spec.ts` (6개) — 디버그 페이지 진단 계약. `docs/product/eng-notes.md`의 **ENG-001**에 등재. (2026-07-12 사용자 결정: 삭제하지 않고 엔지니어링 노트로 분리·연결.)
- (보강 권장) **AR4** — 워크플로우 상세 라이브 폴링 자동 갱신

## 다음 단계 제안

문서 체계·1:1 매핑 유지. 2026-08-07 OV7 전용 스펙 신설로 **자동화 공백 0(연결 AC 53↔전용 스펙 53, 전단사 완성)**. 남은 것:
1. (선택) **FX6·AR4** 상세 라이브 폴링 직접 검증 보강.

## 변경 이력

| 시점 | 변경 내용 | 이전 상태 | 이후 상태 |
|------|-----------|-----------|-----------|
| 2026-06-19 | 가치 문서 생성 (V1~V7), 소유자 = 클러스터 운영자 | 가치 0개 | 가치 7개 |
| 2026-06-19 | PRD-Overview 작성 (AC1~AC7) | PRD 0개 | PRD 1개, AC 7개 |
| 2026-06-20 | 탭별 PRD 7종 추가 | PRD 1개, AC 7개 | PRD 8개, AC 43개 |
| 2026-06-21 | 공통 셸 PRD(CM) 추가 — V2 커버 | PRD 8개, AC 43개 | PRD 9개, AC 49개 |
| 2026-06-21 | main 푸시 (문서 11종) | 로컬 전용 | origin/main 반영 |
| 2026-06-22 | 테스트 문서 4종 (OV·PD·CM·FX) | 테스트 0개 | 테스트 4개, AC 27개 커버 |
| 2026-06-22 | SC3 재정의 → V4 연결, V4 확장 (reconciliation 포함) | 미연결 1개 | 미연결 0개 |
| 2026-06-22 | 테스트 문서 5종 추가 (ND·WL·SC·ES·AR) | 테스트 4개, AC 27개 커버 | 테스트 9개, AC 49개 전부 커버, **문서 체계 건강** |
| 2026-06-29 | ConfigMaps PRD(CF)·테스트 문서 추가 — V1·V7 커버, e2e 포함 | PRD 9개, AC 49개, 테스트 9개 | PRD 10개, AC 52개 전부 커버, 테스트 10개, **문서 체계 건강 유지** |
| 2026-07-02 | 네임스페이스 URL 딥링크 AC(CM7)·테스트 시나리오 추가 — V7 확장, 단위·e2e 포함 | AC 52개 | AC 53개 전부 커버, **문서 체계 건강 유지** |
| 2026-07-12 | e2e AC↔스펙 파일 **1:1 재구조화** — 공유 15·중복 9 분할/병합, debug 6종 `e2e/eng/`(ENG-001) 분리·health `e2e/smoke/` 이동, FluxCD 상세(FX3~6) 전용 스펙 승격·OV6 공백 재분류. 테스트 626건 무손실 | 공유·중복·고아 다수, 공백 8 | 연결 AC 48↔전용 스펙 48(전단사), 공백 5(OV6·OV7·PD6·SC3·CM3) |
| 2026-07-20 | 위 재구조화의 e2e 회귀 수정(격리) — FluxCD **클러스터 변경 스펙(FX3 reconcile·FX4 suspend/resume)** 을 FX2 목록 리더가 관측하지 않는 **전용 픽스처**(`git-repo-mut`·`kust-mut-*`, `targetNamespace: default` 없음)로 격리. 파일 재병합(공존) 대안은 거부됨 — 별도 파일 유지, 엄격한 파일 단위 1:1 보존 | FX3·FX4 가 공유 `app-ready`/`app-suspended`/`flux-system` 을 변경해 `workers:4` 병렬에서 FX2 와 레이스 | 연결 AC 48↔전용 스펙 48 유지, 물리 파일 1:1 예외 없음 |
| 2026-07-23 | **CM3(상단 바·반응형 셸) 전용 e2e 신설** — `e2e/top-bar.spec.ts` 추가. 앱 타이틀·`ClusterStatus`("Cluster Connected")·반응형 컨테이너 클래스(`flex-col`↔`sm:flex-row`)·모바일 세로↔데스크톱 가로 배치를 직접 단정(픽스처 무의존, 정적 셸 마크업). `test-common.md` 시나리오3 자동화 연결. CM/CM3 공백 해소 | 자동화 공백 5(OV6·OV7·PD6·SC3·CM3), 연결 AC 48↔전용 스펙 48 | 자동화 공백 4(OV6·OV7·PD6·SC3), 연결 AC 49↔전용 스펙 49 |
| 2026-07-27 | **PD6(완료 파드 숨김 토글) 전용 e2e 신설** — `e2e/pods-hide-completed.spec.ts` 추가. `/api/pods/all` 를 route-mock 으로 Running/Succeeded 파드를 주입해 `hide-completed-toggle`(completedCount>0 시 노출)·클라이언트 필터(`filteredPods`, COMPLETED_STATUSES=succeeded/completed)·`no-visible-pods-message`("All pods are completed…") 빈 상태를 직접 단정(픽스처 무의존, 브라우저 레벨 인터셉트로 레이스 무관). `test-pods.md` 시나리오7 자동화 연결. PD6 공백 해소 | 자동화 공백 4(OV6·OV7·PD6·SC3), 연결 AC 49↔전용 스펙 49 | 자동화 공백 3(OV6·OV7·SC3), 연결 AC 50↔전용 스펙 50 |
| 2026-07-26 | **FX2(네임스페이스 필터) e2e 레이스 안정화** — CM3 스펙 추가로 `workers:4` 샤드가 재편되며 `fluxcd-kustomizations.spec.ts:203` 이 재노출한 스냅샷 레이스(필터 적용 전 union 카운트를 `count()`+`nth()` 로 캡처 → `apply-all.sh` 가 `default` 로 이관한 `backend-app` 카드가 탈착되며 "unexpected value default" 실패)를 `expect.poll` 로 필터 정착까지 재시도하도록 수정. 픽스처·앱·커버리지 무변(FX2 게이트 유지) | CM3 PR 게이트 red(범위 밖 FX2 레이스), 연결 AC 49↔전용 스펙 49 | E2E 게이트 결정적, 연결 AC 49↔전용 스펙 49 유지 |
| 2026-07-30 | **OV6·SC3 전용 e2e 신설로 공백 3→1** — `e2e/overview-namespace-scope.spec.ts`(OV6, 실 클러스터에서 네임스페이스 전환 시 `GET /api/overview?ns=` 스코프 재조회 관측·모킹 없음)·`e2e/secrets-delete-resync.spec.ts`(SC3, 삭제 확인→`DELETE /api/secrets/:ns/:name` 트리거 단정. 목록 GET은 실 fixture, 파괴적 DELETE만 인터셉트하는 정당 **DES** 예외로 `docs/e2e-mocking-policy.md` 허용목록 #5 등재) 추가. `test-overview.md`(OV6)·`test-secrets.md`(SC3) 자동화 연결. **OV7은 데이터-모킹 정책 위반으로 이번 슬라이스에서 제외**(후속: metrics-server 부재 kind 프로파일 또는 mock-policy 예외 승인). 직전 시도(rct_20260729-0001 att0)의 SC3 구문 결함(docstring `*/`)·형제 mock-policy 미착지 원인을 재계획으로 해소 **(SC3의 DES 모킹 접근은 2026-08-01 리뷰 반려로 real fixture 실삭제로 대체됨 — 아래 행 참조)** | 자동화 공백 3(OV6·OV7·SC3), 연결 AC 50↔전용 스펙 50 | 자동화 공백 1(OV7), 연결 AC 52↔전용 스펙 52 |
| 2026-08-01 | **SC3 재작업 — 모킹 제거·전용 fixture 실삭제** — 리뷰 반려("모킹하지 말고 다른 테스트에 영향 안 받는 별도 fixture로 실제 삭제 테스트")를 반영. `e2e/secrets-delete-resync.spec.ts`를 인터셉트 0으로 재작성해 전용 fixture `secret-mut-delete`(`test/fixtures/secret-mut-fixtures.yaml`, dashboard-test)를 **실제로 DELETE**하고 대상 아코디언 소멸을 단정(앱 refetch). `fluxcd-mut-fixtures.yaml` 격리 선례를 따라 SC1/SC2/SC4(`test-secret`/`tls-secret`, `>= 2` 단정)에 무영향. `docs/e2e-mocking-policy.md` 허용목록 **DES #5 제거**(브랜치 신규 인터셉트 0 → 형제 모델 `tbm_kubernetes-dashboard-e2e-mock-policy` 무drift). ESO 재동기화 재생성은 kind에 ESO 컨트롤러가 없어 하네스 밖(후속). 전단사·공백 집계 불변 | 자동화 공백 1(OV7), 연결 AC 52↔전용 스펙 52, SC3=DES 모킹 | 자동화 공백 1(OV7), 연결 AC 52↔전용 스펙 52, SC3=real fixture 실삭제·mock 0 |
| 2026-08-07 | **OV7 전용 e2e 신설 — 실환경 메트릭 부재 폴백(공백 1→0, 전단사 완성)** — `e2e/overview-metrics-fallback.spec.ts`(최상위) 추가. CI E2E 워크플로를 matrix(`default`|`no-metrics`)로 확장하고 `scripts/kind-cluster.sh`에 `INSTALL_METRICS_SERVER`(기본 true) 게이트 추가 — `no-metrics` leg는 별도 러너에서 metrics-server 없는 kind 클러스터를 띄워 이 스펙만(`--project=no-metrics`) 실행(playwright.config.ts 프로젝트 분리). metrics 의존 스펙(OV1 등)은 `default` leg(다른 클러스터)라 무영향. 인터셉트 0 → 형제 `tbm_kubernetes-dashboard-e2e-mock-policy` 무drift. `test-overview.md`(OV7)·본 문서 집계 갱신. 앱 코드 무변경(폴백은 기존·유닛 커버) | 자동화 공백 1(OV7), 연결 AC 52↔전용 스펙 52 | 자동화 공백 0, 연결 AC 53↔전용 스펙 53(전단사 완성) |
