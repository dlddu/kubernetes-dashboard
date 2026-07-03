# kubernetes-dashboard 문서 체계 상태 추적

> 이 문서는 제품 문서 체계의 **현재 상태와 연결 관계**를 기록·추적·진단한다.
> 문서를 생성하거나 수정할 때마다 이 문서를 함께 갱신한다.

## 현재 상태 요약

- 정의된 가치: **7개** (V1~V7) — 소유자: 클러스터 운영자
- PRD: **10개** (탭별 9개 + 공통 셸 1개)
- Acceptance Criteria: **53개** (가치 연결됨: 53 / 미연결: 0)
- 테스트 문서: **10개** (AC 커버됨: 53 / 미커버: 0)
- **건강 상태**: 🟢 **건강함** — 가치→PRD→AC→테스트 문서가 모두 연결됨(7개 조건 충족). 남은 것은 **자동화 공백 8개**(테스트 문서는 있으나 e2e 미작성)로, 문서 체계 외부의 구현 백로그.

## PRD ↔ 테스트 문서 인덱스

| 코드 | PRD | 위치 | 달성 가치 | AC | 테스트 문서 | 자동화 공백 |
|------|-----|------|-----------|----|-------------|-------------|
| OV | `prd-overview.md` | `/` | V1, V6, V7 | 7 | `test-overview.md` | OV7 |
| ND | `prd-nodes.md` | `/nodes` | V1 | 3 | `test-nodes.md` | — |
| WL | `prd-workloads.md` | `/workloads` | V1, V3, V7 | 4 | `test-workloads.md` | — |
| PD | `prd-pods.md` | `/pods` | V1, V3, V6, V7 | 7 | `test-pods.md` | PD6 |
| SC | `prd-secrets.md` | `/secrets` | V4, V5, V7 | 4 | `test-secrets.md` | SC3 |
| CF | `prd-configmaps.md` | `/configmaps` | V1, V7 | 3 | `test-configmaps.md` | — |
| ES | `prd-external-secrets.md` | `/external-secrets` | V5, V7 | 4 | `test-external-secrets.md` | — |
| AR | `prd-argo.md` | `/argo` | V1, V4, V6, V7 | 7 | `test-argo.md` | (AR4 폴링 보강) |
| FX | `prd-fluxcd.md` | `/flux` | V1, V4, V6, V7 | 7 | `test-fluxcd.md` | FX3·FX4·FX5·FX6 |
| CM | `prd-common.md` | 앱 셸(전역) | V1, V2, V6, V7 | 7 | `test-common.md` | CM3 |

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

### 자동화 공백 (테스트 문서는 있으나 e2e 미작성) 🟢
문서 체계 건강과는 별개인 **e2e 구현 백로그**:
- **SC3** — ESO 대상 Secret 삭제 → External Secret 재동기화 (ESO 연동 e2e 필요)
- **FX3·FX4·FX5·FX6** — FluxCD 상세 페이지 reconcile/suspend/branch/polling (상세 페이지 e2e 스펙 자체 부재)
- **OV7** — 메트릭 서버 부재 시 폴백 (metrics 비활성 시나리오)
- **PD6** — 완료 파드 숨김 토글
- **CM3** — 상단 바 전용 검증 (현재 탭 뷰포트 테스트로 간접 커버)
- (보강 권장) **AR4** — 워크플로우 상세 라이브 폴링 자동 갱신

## 다음 단계 제안

문서 체계는 완성. 남은 것은 자동화 백로그(우선순위):
1. **FluxCD 상세 e2e** (FX3~FX6) — 상세 페이지 스펙이 통째로 없어 영향 가장 큼.
2. **SC3 ESO 재동기화 e2e** — 외부 저장소 연동 통합 테스트.
3. **OV7·PD6·CM3·AR4** — 단위/시나리오 보강.

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
