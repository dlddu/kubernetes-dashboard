# kubernetes-dashboard 문서 체계 상태 추적

> 이 문서는 제품 문서 체계의 **현재 상태와 연결 관계**를 기록·추적·진단한다.
> 문서를 생성하거나 수정할 때마다 이 문서를 함께 갱신한다.

## 현재 상태 요약

- 정의된 가치: **7개** (V1~V7) — 소유자: 클러스터 운영자
- PRD: **9개** (탭별 8개 + 공통 셸 1개)
- Acceptance Criteria: **49개** (가치 연결됨: 48 / 미연결: 1)
- 테스트 문서: **4개** (AC 커버됨: 27 / 미커버: 22)
- 자동화 공백(테스트 문서는 있으나 e2e 미비): **7개 AC**
- **건강 상태**: 🟡 위험 있음 — ① 미연결 AC 1개(Secrets 삭제), ② 22개 AC가 아직 테스트 문서 없음, ③ 자동화 공백 7개.

## PRD 인덱스

| 코드 | PRD | 위치 | 달성 가치 | AC 수 | 테스트 문서 |
|------|-----|------|-----------|-------|-------------|
| OV | `prd-overview.md` | `/` | V1, V6, V7 | 7 | ✅ `test-overview.md` |
| ND | `prd-nodes.md` | `/nodes` | V1 | 3 | — |
| WL | `prd-workloads.md` | `/workloads` | V1, V3, V7 | 4 | — |
| PD | `prd-pods.md` | `/pods` | V1, V3, V6, V7 | 7 | ✅ `test-pods.md` |
| SC | `prd-secrets.md` | `/secrets` | V5, V7 (+미연결 1) | 4 | — |
| ES | `prd-external-secrets.md` | `/external-secrets` | V5, V7 | 4 | — |
| AR | `prd-argo.md` | `/argo` | V1, V4, V6, V7 | 7 | — |
| FX | `prd-fluxcd.md` | `/flux` | V1, V4, V6, V7 | 7 | ✅ `test-fluxcd.md` |
| CM | `prd-common.md` | 앱 셸(전역) | V1, V2, V6, V7 | 6 | ✅ `test-common.md` |

## 가치 커버리지 매트릭스

| 가치 | 커버 PRD | 연결된 AC | 테스트 문서 | 상태 |
|------|----------|-----------|-------------|------|
| V1: 클러스터 상태를 한눈에 | OV, ND, WL, PD, AR, FX, CM | OV1·OV2·OV3·OV7, ND1·ND2·ND3, WL1·WL4, PD1·PD7, AR1·AR3·AR4·AR7, FX1·FX2·FX6·FX7, CM2·CM3 | OV·PD·FX·CM ✓ / ND·WL·AR ✗ | ⚠️ 일부 검증 |
| V2: 모바일에서 즉시 운영 대응 | CM | CM1·CM2·CM3 | CM ✓ | ✅ 검증(문서) |
| V3: 파드 문제를 앱 안에서 진단·조치 | WL, PD | WL2·WL3, PD2·PD3·PD4·PD5 | PD ✓ / WL ✗ | ⚠️ 일부 검증 |
| V4: GitOps 워크플로우 직접 제어 | AR, FX | AR2·AR5·AR6, FX3·FX4·FX5 | FX ✓ / AR ✗ | ⚠️ 일부 검증 |
| V5: 민감 리소스 안전 열람 | SC, ES | SC1·SC2·SC4, ES1·ES2·ES3·ES4 | ✗ | ❌ 미검증 |
| V6: 실시간 최신 상태 유지 | OV, PD, AR, FX, CM | OV4·OV5, PD2·PD3, AR4, FX6, CM4 | OV·PD·FX·CM ✓ / AR ✗ | ⚠️ 일부 검증 |
| V7: 네임스페이스 포커스/개인화 | OV, WL, PD, SC, ES, AR, FX, CM | OV6, WL1, PD1·PD6, SC1, ES1, AR1, FX1·FX2, CM5·CM6 | OV·PD·FX·CM ✓ / WL·SC·ES·AR ✗ | ⚠️ 일부 검증 |

## 테스트 문서 인덱스

| 테스트 문서 | 대상 PRD | 커버 AC | 자동화 공백 |
|-------------|----------|---------|-------------|
| `test-overview.md` | OV | OV1~OV7 | OV7(메트릭 폴백) |
| `test-pods.md` | PD | PD1~PD7 | PD6(완료 숨김 토글) |
| `test-common.md` | CM | CM1~CM6 | CM3(상단 바 전용) |
| `test-fluxcd.md` | FX | FX1~FX7 | FX3·FX4·FX5·FX6(상세 액션·폴링) |

## 위험 진단

### 고아 가치 / 미정렬 문서 / 무가치 PRD / AC 없는 PRD / 고아 테스트
- (모두 없음)

### 미연결 AC (가치와 연결되지 않은 AC) 🟡
- **SC3 (Secrets 삭제)** — "민감 리소스 관리/삭제" 또는 "안전장치" 가치가 없어 연결 불가.
  - 조치: ① 가치 추가 후 연결, 또는 ② SC3 범위 제외.

### 미검증 AC (테스트 문서 없는 AC) 🟢
- **22개** — ND(3), WL(4), SC(4), ES(4), AR(7). 테스트 문서 미작성.

### 자동화 공백 (테스트 문서는 있으나 e2e 미비) 🟢
- **OV7**(메트릭 폴백), **PD6**(완료 숨김 토글), **CM3**(상단 바 전용 검증), **FX3·FX4·FX5·FX6**(FluxCD 상세 페이지 액션·폴링).
- 특히 FluxCD 상세 페이지(reconcile/suspend/branch/polling)는 e2e 스펙 자체가 없어 우선 보강 권장.

## 다음 단계 제안

1. 🟢 **남은 테스트 문서 4종** — ND·WL·SC·ES·AR(특히 액션 있는 WL·AR). 대부분 대응 e2e 존재(연결 위주).
2. 🟡 **SC3 미연결 해소** — 가치 추가 vs 범위 제외(제품 소유자 결정).
3. 🟢 **자동화 공백 보강** — FluxCD 상세 e2e 우선, 이어 OV7·PD6·CM3.

## 변경 이력

| 시점 | 변경 내용 | 이전 상태 | 이후 상태 |
|------|-----------|-----------|-----------|
| 2026-06-19 | 가치 문서 생성 (V1~V7), 소유자 = 클러스터 운영자 | 가치 0개 | 가치 7개 |
| 2026-06-19 | PRD-Overview 작성 (AC1~AC7) | PRD 0개 | PRD 1개, AC 7개 |
| 2026-06-20 | 탭별 PRD 7종 추가 | PRD 1개, AC 7개 | PRD 8개, AC 43개 |
| 2026-06-21 | 공통 셸 PRD(CM) 추가 — V2 커버 | PRD 8개, AC 43개 | PRD 9개, AC 49개 |
| 2026-06-21 | main 푸시 (문서 11종) | 로컬 전용 | origin/main 반영 |
| 2026-06-22 | 테스트 문서 4종 추가 (OV·PD·CM·FX) | 테스트 0개 | 테스트 4개, AC 27개 커버, 자동화 공백 7개 식별 |
