# 주석 정책

> 모델 `tbm_kubernetes-dashboard-comment-necessity`, 템플릿 reconciler `templates/comment-necessity.tbm.md`. 판정 원장은 [ledger.md](ledger.md), 판정 상세는 [passes/](passes/).

이 레포의 주석은 **필요 사유를 한 문장으로 댈 수 있는 것**만 남긴다. 사유 없는 주석은 아무도 검증하지 않은 채 낡아 가고, 읽는 사람의 주의를 필요한 주석과 나눠 가진다. 지운 주석은 git 이력에 남는다.

## 필요성 시험

> 이 주석을 지우면, 이 코드를 고치러 온 사람이 틀린 판단을 하거나 그 판단에 필요한 사실을 확인하는 데 상당한 비용을 치르는가?

예라면 그 결과(무엇을 틀리게 되는가, 무엇을 어디서 찾아야 하는가)를 적은 한 문장이 필요 사유다.

- 사유를 한 문장으로 댈 수 없으면 지운다. 애매함은 보존의 근거가 아니다.
- 사유는 결과를 말한다. "중요함"·"참고용"·"나중에 필요할 수 있음"은 사유가 아니다.
- 불필요의 흔한 유형: 코드 재진술, 저장소 문서 재진술, PR·커밋 이력 재진술, 작업 흔적(누가·언제·끝난 TODO·경위), 장식·구분선, 소감·추측, 주석 처리된 코드. 테스트의 `// Arrange`·`// Act`·`// Assert`와 spec 머리 블록도 같다 — 관례라는 사실은 사유가 아니다. 목록은 시험을 대신하지 않는다.
- 필요한 지식이라도 이름·타입·테스트·저장소 문서로 옮길 수 있으면 옮기고 주석은 지운다. 옮기는 변경은 같은 PR에 둔다.
- 틀린 주석(코드·문서와 어긋남)은 사유가 있으면 고치고 없으면 지운다.
- **유지는 기록으로 끝난다.** 남기는 주석(또는 같은 사유를 공유하는 묶음)마다 사유 한 문장을 해당 패스의 `passes/` 파일 유지 목록에 적는다.

## 유지 대상 (이 밖은 제거)

- **기계가 읽는 주석** — 시험 면제: `//go:embed`·`//nolint:errcheck`·`/* eslint-disable … */` 등 도구 지시자와 `mock-exception:`(`docs/e2e-mocking-policy.md` 허용목록과 1:1 대조).
- **doc 주석** — Go(`handlers/`·`internal/`·`main.go`·`test/`)는 exported 식별자의 이름으로 시작하는 1줄 doc 주석, 패키지 주석은 요구하지 않는다. TS(`frontend/src`)는 export 함수·컴포넌트·훅·타입의 JSDoc 요약 1줄이고 `@param`·`@returns`는 타입이 말하는 범위를 넘을 때만 남긴다. 테스트(`*_test.go`·`*.test.ts(x)`·`e2e/**/*.spec.ts`·`e2e/helpers/`·`test/`)에는 이 수준을 요구하지 않는다. 수준을 넘는 본문은 시험을 받는다.
- **필요 사유가 있는 주석** — 이 레포에서 흔한 사유: Kubernetes API·client-go의 문서화되지 않은 동작, 외부 도구와의 호환 계약(FluxCD GitHub App Secret 필드명), WebSocket exec·SPDY·SSE의 실패 모드 함정, kind 클러스터·fixture가 실환경과 갈리는 지점, Playwright·vitest의 대기·격리 함정, 테스트가 기대는 fixture 불변식. 예시이지 면제가 아니다 — 주석마다 사유를 댄다.

## 운영

- 판정 단위는 원장의 행(파일)이다. 판정 칸이 `완료`가 아닌 행을 가져가 판정하고, 유지분의 사유를 `passes/<판정일>-<slug>.md`에 적은 뒤 행의 줄 수·지문·판정 칸을 갱신한다.
- 행 순서는 첫 파일 경로의 사전순이다. 새 행을 표 끝에 덧붙이지 않는다.
- **원장 게이트**: `python3 scripts/comment-policy/gate.py` — 원장의 파일 소속(유일·전수), 줄 수·지문, 판정 칸 표기를 실측(`scripts/comment-policy/measure.sh`, 모델 as-is 지문과 같은 범위 규칙)과 대조하고 집계를 출력한다. 미판정(`—`)은 실패가 아니다. 변경 파일을 `git add`한 뒤 돌린다(실측이 추적 파일 목록을 쓴다). 행 초안은 `--emit`.
- CI 연결은 아직 없다: `.github/workflows/`를 고치려면 `workflows` 권한이 필요해 자동 PR로는 올릴 수 없다. 사람이 `ci.yaml`에 위 게이트 한 단계를 더한다.

## 범위

레포 전체에서 세 부류만 뺀 것이 대상이다: ① 문서(`docs/`, `*.md`) ② 편집 불가(벤더·빌드 산출물·락 파일·`DO NOT EDIT`/`@generated` 표식 파일) ③ 주석 문법 없는 데이터(JSON·CSV·키·바이너리). CI 워크플로·`k8s/`·`test/fixtures/*.yaml`·`scripts/`·`Dockerfile`·`Makefile*`·설정 파일은 주석 문법이 있으면 대상이다. 손으로 쓴 stub clientset(`internal/*versioned/`)도 대상이다.

레포 고유 제외 — 현재 없음. 필요하면 정보 문자열이 `comment-scope-exclude`인 코드 블록에 한 줄에 ERE 하나씩 적고, 줄마다 부류(①②③)를 위 산문에 적는다.

## 지문 사각지대

MIXED·MARKUP 파일과 줄 중간 `#`이 주석이 아닌 HASH 파일의 줄 끝 주석, `*`로 시작하지 않는 블록 주석 연속 줄, Python 밖의 docstring 성격 문자열, 줄 스캐너의 문자열 추적 한계(JS 정규식 리터럴, JSX 텍스트의 따옴표·`//`)는 지문이 보지 못한다. `//nolint:` 뒤에 붙인 사유도 값을 바꾸지 않는다.
