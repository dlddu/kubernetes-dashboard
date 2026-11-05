# 주석 판정 원장

판정한 범위(파일 단위)와 그 범위의 현재 주석 줄 수·지문·판정 결과를 적는 표다. 정책 본문은 [README.md](README.md), 판정 상세는 [passes/](passes/).

## 읽는 법

- 행은 파일 하나다. 주석 줄을 가진 파일은 표면별 표에서 정확히 한 행에 속한다. 행 순서는 파일 경로의 사전순이다.
- **현재 줄 수·지문**은 `scripts/comment-policy/measure.sh` 실측과 같아야 한다. 지문은 그 파일의 주석 줄(`경로:정규화한 본문`)을 정렬해 이은 문자열의 sha256 앞 12자리다.
- **판정** 칸: `완료` = 그 행의 현재 지문에 대해 필요성 판정을 마쳤고 유지분의 사유가 `passes/`에 있다. `—` = 아직 판정하지 않았다.
- 판정하지 않은 주석을 들이는 PR은 자기 파일의 행을 더하거나 고치고 판정 칸을 `—`로 둔다. 판정된 행의 파일에 주석을 더하면 줄 수·지문을 갱신하고 `—`로 되돌린다.
- 주석이 모두 사라진 파일은 행이 없다 — 제거 내역은 해당 패스 파일에 있다.
- 합계·잔량은 저장하지 않는다. `python3 scripts/comment-policy/gate.py`가 표와 실측에서 계산해 출력한다. 표 행 초안은 `--emit`.

## 줄머리 주석 (L)

| 판정일 | 범위 | 현재 줄 수 | 지문 | 판정 | 결과 |
|---|---|---|---|---|---|
| 2026-11-04 | `.github/workflows/ci.yaml` | 28 | a92132524dbb | — | |
| 2026-11-04 | `.github/workflows/e2e.yaml` | 7 | 5ed652f39002 | — | |
| 2026-11-04 | `Dockerfile` | 1 | 3c1cac637a36 | 완료 | git 설치 사유 1줄 유지, 나머지 제거 — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/argo-data-states.spec.ts` | 8 | 5013fd1fc749 | 완료 | 유지 8줄(관측·경쟁 함정, fixture 불변식) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/argo-submit.spec.ts` | 103 | a6e8115b8656 | — | |
| 2026-11-04 | `e2e/argo-templates.spec.ts` | 3 | 119bfa6ff544 | 완료 | 유지 3줄(필터·대기 함정) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/argo-workflow-delete.spec.ts` | 2 | a8539614f8c1 | 완료 | 유지 2줄(공유 fixture 보호) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/argo-workflow-detail.spec.ts` | 222 | d6d28c745b51 | — | |
| 2026-11-04 | `e2e/argo-workflows.spec.ts` | 256 | b32e844b35cc | — | |
| 2026-11-04 | `e2e/bottom-tab-bar.spec.ts` | 96 | 38d92b5627ad | — | |
| 2026-11-04 | `e2e/common-unhealthy-badge.spec.ts` | 3 | 4b62f1d3b99d | 완료 | 유지 3줄(회귀 방지 사유) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/configmaps-accordion.spec.ts` | 32 | b8d5825f7a8b | — | |
| 2026-11-04 | `e2e/configmaps-tab.spec.ts` | 24 | 296853256e52 | — | |
| 2026-11-05 | `e2e/eng/debug-back-button.spec.ts` | 1 | 2a624bacf74e | 완료 | ENG-001 머리 표지 1줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-05 | `e2e/eng/debug-context.spec.ts` | 1 | 9ee26a77e315 | 완료 | ENG-001 머리 표지 1줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-05 | `e2e/eng/debug-detail-view.spec.ts` | 1 | dd011db64f82 | 완료 | ENG-001 머리 표지 1줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-05 | `e2e/eng/debug-page-layout.spec.ts` | 1 | 50ecefa6e61e | 완료 | ENG-001 머리 표지 1줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-05 | `e2e/eng/debug-route.spec.ts` | 1 | 26e21cc9e96e | 완료 | ENG-001 머리 표지 1줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-04 | `e2e/eng/debug-toggle.spec.ts` | 103 | bc71969f9797 | — | |
| 2026-11-04 | `e2e/external-secrets-card-status.spec.ts` | 11 | 9632a946fc6e | — | |
| 2026-11-04 | `e2e/external-secrets-data-states.spec.ts` | 1 | dc4ed9904545 | 완료 | 유지 1줄(fixture 불변식) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/external-secrets-summary.spec.ts` | 2 | a498f2e61939 | 완료 | 유지 2줄(fixture 개수) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `e2e/external-secrets.spec.ts` | 33 | 580e1b8ec83f | — | |
| 2026-11-04 | `e2e/fluxcd-branch-switch.spec.ts` | 48 | f048ff614371 | — | |
| 2026-11-04 | `e2e/fluxcd-data-states.spec.ts` | 38 | c9b6db9de1c6 | — | |
| 2026-11-04 | `e2e/fluxcd-detail.spec.ts` | 217 | 54de201a267b | — | |
| 2026-11-04 | `e2e/fluxcd-gitrepositories.spec.ts` | 107 | 0006db229874 | — | |
| 2026-11-04 | `e2e/fluxcd-kustomizations.spec.ts` | 152 | 76a4d882b5da | — | |
| 2026-11-04 | `e2e/fluxcd-reconcile.spec.ts` | 74 | 95bb2b701918 | — | |
| 2026-11-04 | `e2e/fluxcd-suspend-resume.spec.ts` | 117 | 2d1c3851093b | — | |
| 2026-11-05 | `e2e/helpers/debug-setup.ts` | 3 | 294883beebca | 완료 | 재로드 사유 3줄 유지, 나머지 제거 — [passes/2026-11-05-eng-debug-specs.md](passes/2026-11-05-eng-debug-specs.md) |
| 2026-11-04 | `e2e/namespace-favorites.spec.ts` | 174 | 80314f3647b5 | — | |
| 2026-11-04 | `e2e/namespace-filter.spec.ts` | 117 | eb46dcdb0fe8 | — | |
| 2026-11-04 | `e2e/node-quick-view.spec.ts` | 124 | 99a20cc5d999 | — | |
| 2026-11-04 | `e2e/nodes-data-states.spec.ts` | 63 | 86166d18fa8f | — | |
| 2026-11-04 | `e2e/nodes-status-usage.spec.ts` | 88 | 48530545d855 | — | |
| 2026-11-04 | `e2e/nodes-tab.spec.ts` | 57 | 7af72c357920 | — | |
| 2026-11-04 | `e2e/overview-auto-polling.spec.ts` | 35 | b24fda06d64b | — | |
| 2026-11-04 | `e2e/overview-manual-refresh.spec.ts` | 28 | daff9caab017 | — | |
| 2026-11-04 | `e2e/overview-metrics-fallback.spec.ts` | 26 | c47f3066de16 | — | |
| 2026-11-04 | `e2e/overview-namespace-scope.spec.ts` | 29 | a1d4ca9c06f4 | — | |
| 2026-11-04 | `e2e/overview-summary-cards.spec.ts` | 181 | d2fcb6527797 | — | |
| 2026-11-04 | `e2e/pod-cleanup.spec.ts` | 83 | e49c92b0d523 | — | |
| 2026-11-04 | `e2e/pod-debug.spec.ts` | 43 | 2fd4c06958a0 | — | |
| 2026-11-04 | `e2e/pod-exec.spec.ts` | 121 | 2db6d6a2421a | — | |
| 2026-11-04 | `e2e/pod-logs.spec.ts` | 302 | 581feb903a6a | — | |
| 2026-11-04 | `e2e/pods-data-states.spec.ts` | 47 | 3b56195f0b36 | — | |
| 2026-11-04 | `e2e/pods-hide-completed.spec.ts` | 42 | 39d60e479620 | — | |
| 2026-11-04 | `e2e/pods-namespace-scope.spec.ts` | 28 | c40befe8c4be | — | |
| 2026-11-04 | `e2e/pods.spec.ts` | 209 | 219386293f60 | — | |
| 2026-11-04 | `e2e/polling-indicator.spec.ts` | 100 | 415546b785bd | — | |
| 2026-11-04 | `e2e/secrets-data-states.spec.ts` | 36 | 34c3e83f67b9 | — | |
| 2026-11-04 | `e2e/secrets-delete-resync.spec.ts` | 35 | 0c3373c430d4 | — | |
| 2026-11-04 | `e2e/secrets-reveal.spec.ts` | 64 | bed276aa0c38 | — | |
| 2026-11-04 | `e2e/secrets-tab.spec.ts` | 32 | 333e6d1d11c9 | — | |
| 2026-11-04 | `e2e/smoke/health.spec.ts` | 28 | e2f0a12a1060 | — | |
| 2026-11-04 | `e2e/top-bar.spec.ts` | 36 | 3b3687d553ca | — | |
| 2026-11-04 | `e2e/unhealthy-pod-preview.spec.ts` | 54 | 657f1680f7d1 | — | |
| 2026-11-04 | `e2e/workloads-data-states.spec.ts` | 40 | 11d2ac448d4e | — | |
| 2026-11-04 | `e2e/workloads-list.spec.ts` | 50 | 85f6053ea316 | — | |
| 2026-11-04 | `e2e/workloads-restart-confirm.spec.ts` | 27 | a78745014639 | — | |
| 2026-11-04 | `e2e/workloads-restart.spec.ts` | 27 | 4376d156b333 | — | |
| 2026-11-04 | `frontend/src/App.test.tsx` | 19 | 6e7bc0c06c27 | — | |
| 2026-11-04 | `frontend/src/api/argo.test.ts` | 189 | 18d9dc420336 | — | |
| 2026-11-04 | `frontend/src/api/client.ts` | 6 | 5c64f299f40d | — | |
| 2026-11-04 | `frontend/src/api/configMaps.test.ts` | 60 | 1c6410b8b24f | — | |
| 2026-11-04 | `frontend/src/api/debugFetch.test.ts` | 100 | 46b1bfd5b269 | — | |
| 2026-11-04 | `frontend/src/api/debugFetch.ts` | 12 | 849af6031ca5 | — | |
| 2026-11-04 | `frontend/src/api/fluxcd.test.ts` | 33 | 630e101fa881 | — | |
| 2026-11-04 | `frontend/src/api/fluxcd.ts` | 1 | 157cc77c5cfb | — | |
| 2026-11-04 | `frontend/src/api/fluxcd_detail.test.ts` | 43 | d882533c9ac5 | — | |
| 2026-11-04 | `frontend/src/api/fluxcd_reconcile.test.ts` | 23 | 7a8b68f69614 | — | |
| 2026-11-04 | `frontend/src/api/namespaces.test.ts` | 31 | c5e5c78ffb65 | — | |
| 2026-11-04 | `frontend/src/api/overview.test.ts` | 53 | 659b7ca03c76 | — | |
| 2026-11-04 | `frontend/src/api/overview.ts` | 1 | c3c83e9fbee2 | — | |
| 2026-11-04 | `frontend/src/api/pods.test.ts` | 83 | c13519509bc0 | — | |
| 2026-11-04 | `frontend/src/api/secrets.test.ts` | 77 | feaa63062c5c | — | |
| 2026-11-04 | `frontend/src/components/ArgoTab.test.tsx` | 198 | a4c0e82dc067 | — | |
| 2026-11-04 | `frontend/src/components/BottomTabBar.test.tsx` | 177 | 10b99efec96d | — | |
| 2026-11-04 | `frontend/src/components/BottomTabBar.tsx` | 2 | d3813696d074 | — | |
| 2026-11-04 | `frontend/src/components/ConfigMapAccordion.test.tsx` | 46 | be9aff268985 | — | |
| 2026-11-04 | `frontend/src/components/ConfigMapAccordion.tsx` | 5 | d787c074cf15 | — | |
| 2026-11-04 | `frontend/src/components/ConfigMapKeyValue.test.tsx` | 32 | d74c6fd28ccf | — | |
| 2026-11-04 | `frontend/src/components/ConfigMapsTab.test.tsx` | 53 | 41aaa9d4db77 | — | |
| 2026-11-04 | `frontend/src/components/ConfigMapsTab.tsx` | 1 | 46933a09cf5d | — | |
| 2026-11-04 | `frontend/src/components/DebugDetailView.test.tsx` | 216 | ee96a5a8a128 | — | |
| 2026-11-04 | `frontend/src/components/DebugDetailView.tsx` | 4 | e38340e50c22 | — | |
| 2026-11-04 | `frontend/src/components/DebugPage.test.tsx` | 3 | 944a4b644b59 | — | |
| 2026-11-04 | `frontend/src/components/DebugPage.tsx` | 2 | ce44ce919ba6 | — | |
| 2026-11-04 | `frontend/src/components/DebugPodDialog.test.tsx` | 3 | e1793050878b | — | |
| 2026-11-04 | `frontend/src/components/DebugPodDialog.tsx` | 2 | 6a1d0228efbb | — | |
| 2026-11-04 | `frontend/src/components/DebugToggle.test.tsx` | 108 | ff022a732cb1 | — | |
| 2026-11-04 | `frontend/src/components/DeploymentCard.test.tsx` | 73 | 30e3c1d91b7f | — | |
| 2026-11-04 | `frontend/src/components/DeploymentCard.tsx` | 5 | a7f6323f2d88 | — | |
| 2026-11-04 | `frontend/src/components/EmptyState.test.tsx` | 97 | 8aa31842f8b8 | — | |
| 2026-11-04 | `frontend/src/components/EmptyState.tsx` | 4 | eb12418c6047 | — | |
| 2026-11-04 | `frontend/src/components/ErrorRetry.test.tsx` | 102 | be3ed594ecae | — | |
| 2026-11-04 | `frontend/src/components/ErrorRetry.tsx` | 4 | 77c3c80d1cce | — | |
| 2026-11-04 | `frontend/src/components/FluxCDTab.test.tsx` | 13 | d8317e1a2640 | — | |
| 2026-11-04 | `frontend/src/components/FluxCDTab.tsx` | 9 | 6164194fb2c8 | — | |
| 2026-11-04 | `frontend/src/components/GitRepositoryDetailPage.tsx` | 4 | 3d603c51710b | — | |
| 2026-11-04 | `frontend/src/components/JsonRenderer.tsx` | 3 | cb811b434a80 | — | |
| 2026-11-04 | `frontend/src/components/KustomizationDetail.test.tsx` | 223 | 96fdd849ec78 | — | |
| 2026-11-04 | `frontend/src/components/KustomizationDetailPage.tsx` | 11 | b30cab74e47e | — | |
| 2026-11-04 | `frontend/src/components/LoadingSkeleton.test.tsx` | 62 | 7530656c7647 | — | |
| 2026-11-04 | `frontend/src/components/LoadingSkeleton.tsx` | 2 | c87be9123d3f | — | |
| 2026-11-04 | `frontend/src/components/NamespaceSelector.test.tsx` | 202 | c564c9b8f419 | — | |
| 2026-11-04 | `frontend/src/components/NamespaceSelector.tsx` | 5 | c724e1e41b4f | — | |
| 2026-11-04 | `frontend/src/components/NodeCard.test.tsx` | 98 | 562e0e0f7ab3 | — | |
| 2026-11-04 | `frontend/src/components/NodeCard.tsx` | 7 | 9ce0c7953c48 | — | |
| 2026-11-04 | `frontend/src/components/NodeQuickView.test.tsx` | 155 | 2b32ed282fe5 | — | |
| 2026-11-04 | `frontend/src/components/NodeQuickView.tsx` | 11 | c6a82fae6335 | — | |
| 2026-11-04 | `frontend/src/components/NodesTab.test.tsx` | 63 | 6632de31caf0 | — | |
| 2026-11-04 | `frontend/src/components/OverviewTab.tsx` | 1 | 22abc4fea294 | — | |
| 2026-11-04 | `frontend/src/components/PodExecPanel.tsx` | 13 | f3f14dc340bb | — | |
| 2026-11-04 | `frontend/src/components/PodLogPanel.test.tsx` | 176 | 2a5f37a0ad82 | — | |
| 2026-11-04 | `frontend/src/components/PodLogPanel.tsx` | 13 | 0982a9d36f24 | — | |
| 2026-11-04 | `frontend/src/components/PodsTab.test.tsx` | 116 | edb3fdab464e | — | |
| 2026-11-04 | `frontend/src/components/PollingIndicator.test.tsx` | 117 | 0bfe3b4e4805 | — | |
| 2026-11-04 | `frontend/src/components/PollingIndicator.tsx` | 7 | 4bc361236f65 | — | |
| 2026-11-04 | `frontend/src/components/RestartConfirmDialog.test.tsx` | 84 | 335598c62b72 | — | |
| 2026-11-04 | `frontend/src/components/SecretAccordion.test.tsx` | 61 | 396816f92362 | — | |
| 2026-11-04 | `frontend/src/components/SecretAccordion.tsx` | 5 | 9e1b7a67f14b | — | |
| 2026-11-04 | `frontend/src/components/SecretKeyValue.test.tsx` | 68 | 2bbb0a4b2cc6 | — | |
| 2026-11-04 | `frontend/src/components/SecretsTab.test.tsx` | 82 | b5b14b6c7a1b | — | |
| 2026-11-04 | `frontend/src/components/SecretsTab.tsx` | 1 | 9c6cb51d96d3 | — | |
| 2026-11-04 | `frontend/src/components/StatusBadge.test.tsx` | 68 | 6dc1216f54c7 | — | |
| 2026-11-04 | `frontend/src/components/StatusBadge.tsx` | 5 | 68be5dcecd82 | — | |
| 2026-11-04 | `frontend/src/components/StepIO.test.tsx` | 108 | 54cc920ba395 | — | |
| 2026-11-04 | `frontend/src/components/StepIO.tsx` | 2 | 91d02e6084c7 | — | |
| 2026-11-04 | `frontend/src/components/SubmitModal.test.tsx` | 123 | 6d0f6b7a3c53 | — | |
| 2026-11-04 | `frontend/src/components/SubmitModal.tsx` | 5 | 9ef38d1700ee | — | |
| 2026-11-04 | `frontend/src/components/SummaryCard.test.tsx` | 55 | 0f75847a2d7f | — | |
| 2026-11-04 | `frontend/src/components/SummaryCard.tsx` | 2 | c3d72ce8e1d2 | — | |
| 2026-11-04 | `frontend/src/components/SummaryCards.test.tsx` | 60 | 7bc4c6a92502 | — | |
| 2026-11-04 | `frontend/src/components/SummaryCards.tsx` | 7 | 11d792a56f18 | — | |
| 2026-11-04 | `frontend/src/components/UnhealthyPodCard.test.tsx` | 164 | 6ea63257636b | — | |
| 2026-11-04 | `frontend/src/components/UnhealthyPodCard.tsx` | 10 | 1850795acb06 | — | |
| 2026-11-04 | `frontend/src/components/UnhealthyPodPreview.test.tsx` | 146 | 245006e36d82 | — | |
| 2026-11-04 | `frontend/src/components/UnhealthyPodPreview.tsx` | 5 | 5e4982804c96 | — | |
| 2026-11-04 | `frontend/src/components/UsageBar.test.tsx` | 41 | b98e20503c9a | — | |
| 2026-11-04 | `frontend/src/components/UsageBar.tsx` | 2 | bb93f8e5942c | — | |
| 2026-11-04 | `frontend/src/components/WorkflowCard.test.tsx` | 63 | 3a0618b3a71a | — | |
| 2026-11-04 | `frontend/src/components/WorkflowCard.tsx` | 4 | bd569048acdb | — | |
| 2026-11-04 | `frontend/src/components/WorkflowDetail.test.tsx` | 123 | a3aa1342853a | — | |
| 2026-11-04 | `frontend/src/components/WorkflowDetail.tsx` | 7 | f8c41cf81b35 | — | |
| 2026-11-04 | `frontend/src/components/WorkflowTemplateCard.test.tsx` | 62 | 7d46f5a5075e | — | |
| 2026-11-04 | `frontend/src/components/WorkflowTemplateCard.tsx` | 3 | 7c56c73ee67d | — | |
| 2026-11-04 | `frontend/src/components/WorkloadsTab.test.tsx` | 56 | 51d60f7922c9 | — | |
| 2026-11-04 | `frontend/src/contexts/DashboardContext.test.tsx` | 31 | 75c023a9d68e | — | |
| 2026-11-04 | `frontend/src/contexts/DebugContext.test.tsx` | 83 | 10f429e43ab8 | — | |
| 2026-11-04 | `frontend/src/contexts/DebugContext.tsx` | 4 | 0a3afd385306 | — | |
| 2026-11-04 | `frontend/src/contexts/FavoritesContext.test.tsx` | 52 | 078f70ea38d9 | — | |
| 2026-11-04 | `frontend/src/contexts/NamespaceContext.tsx` | 3 | 289cc4c46ad3 | — | |
| 2026-11-04 | `frontend/src/contexts/PollingContext.test.tsx` | 5 | ce004ba1f2a6 | — | |
| 2026-11-04 | `frontend/src/contexts/PollingContext.tsx` | 6 | d01a7d17753a | — | |
| 2026-11-04 | `frontend/src/hooks/useDataFetch.ts` | 9 | ed23dfe6f044 | — | |
| 2026-11-04 | `frontend/src/hooks/usePolling.test.ts` | 122 | 9e9ab04ee5fa | — | |
| 2026-11-04 | `frontend/src/hooks/usePolling.ts` | 2 | 78c5b225a42f | — | |
| 2026-11-04 | `frontend/src/test/setup.ts` | 4 | 725fdfc704d1 | — | |
| 2026-11-04 | `frontend/tailwind.config.js` | 1 | 6870615bfb1c | — | |
| 2026-11-04 | `frontend/tsconfig.json` | 4 | fadc6aad665d | — | |
| 2026-11-04 | `handlers/argo_client.go` | 1 | c5be5caf831b | — | |
| 2026-11-04 | `handlers/argo_client_test.go` | 34 | 1ad488ab30f5 | — | |
| 2026-11-04 | `handlers/argo_templates.go` | 6 | 00b7cd2972f9 | — | |
| 2026-11-04 | `handlers/argo_templates_test.go` | 69 | e4bde5d25b7d | — | |
| 2026-11-04 | `handlers/argo_workflow_detail_handler.go` | 26 | f97997742242 | — | |
| 2026-11-04 | `handlers/argo_workflow_detail_handler_test.go` | 114 | 969800ff27e9 | — | |
| 2026-11-04 | `handlers/argo_workflows.go` | 22 | 7011ed77dd05 | — | |
| 2026-11-04 | `handlers/argo_workflows_handler.go` | 8 | 7082772715ea | — | |
| 2026-11-04 | `handlers/argo_workflows_handler_test.go` | 85 | 5e7305429ecf | — | |
| 2026-11-04 | `handlers/argo_workflows_test.go` | 51 | fb04503b008a | — | |
| 2026-11-04 | `handlers/client.go` | 6 | 1814a69528c7 | — | |
| 2026-11-04 | `handlers/configmaps.go` | 6 | 7089b9e796ac | — | |
| 2026-11-04 | `handlers/configmaps_test.go` | 88 | dc9a830fd4f0 | — | |
| 2026-11-04 | `handlers/constants.go` | 9 | 1d977dd57e90 | — | |
| 2026-11-04 | `handlers/deployments.go` | 5 | d6da35df4a3e | — | |
| 2026-11-04 | `handlers/deployments_test.go` | 87 | c6637e91d922 | — | |
| 2026-11-04 | `handlers/external_secrets.go` | 12 | fb2d2c49725e | — | |
| 2026-11-04 | `handlers/external_secrets_client.go` | 3 | 8ceded765ddd | — | |
| 2026-11-04 | `handlers/fluxcd_client.go` | 1 | 8a408f70f82b | — | |
| 2026-11-04 | `handlers/fluxcd_client_test.go` | 34 | bcae7ae6c29b | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepositories.go` | 3 | 78ae72975dd9 | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepositories_test.go` | 34 | 0c56dfc038da | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_branches_handler.go` | 13 | 1bc6313f47c6 | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_branches_handler_test.go` | 14 | a4604ce36e82 | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_detail_handler.go` | 9 | 667f5621d937 | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_detail_test.go` | 72 | 955a40cfc85b | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_reconcile_handler.go` | 3 | e137daeb16e5 | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_reconcile_test.go` | 40 | e6a7523d688f | — | |
| 2026-11-04 | `handlers/fluxcd_gitrepository_update_branch_handler.go` | 3 | c2c9b8dadf2a | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_detail_handler.go` | 10 | 1a1e48e9d9a4 | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_detail_test.go` | 71 | 9a49fc22d05a | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_reconcile_handler.go` | 3 | f2cdf7372f6d | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_reconcile_test.go` | 40 | be3b2815a724 | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_suspend_handler.go` | 4 | df4fba5c4ab9 | — | |
| 2026-11-04 | `handlers/fluxcd_kustomization_suspend_test.go` | 5 | 051f33b5903f | — | |
| 2026-11-04 | `handlers/fluxcd_kustomizations.go` | 5 | 790313a28aff | — | |
| 2026-11-04 | `handlers/fluxcd_kustomizations_test.go` | 34 | 8ca419442c89 | — | |
| 2026-11-04 | `handlers/github_app_auth.go` | 24 | 83b71152d89b | — | |
| 2026-11-04 | `handlers/github_app_auth_test.go` | 39 | cbde71c4cacf | — | |
| 2026-11-04 | `handlers/livez.go` | 4 | 5663fa4934c2 | — | |
| 2026-11-04 | `handlers/middleware.go` | 20 | a6d446e76a07 | — | |
| 2026-11-04 | `handlers/namespaces.go` | 1 | f354db44f02f | — | |
| 2026-11-04 | `handlers/namespaces_test.go` | 33 | 89513f36dd10 | — | |
| 2026-11-04 | `handlers/node_utils.go` | 21 | b695351e72d2 | — | |
| 2026-11-04 | `handlers/nodes.go` | 3 | 4fd86ededee4 | — | |
| 2026-11-04 | `handlers/nodes_test.go` | 74 | 660a7a2b46cc | — | |
| 2026-11-04 | `handlers/overview.go` | 7 | 0e869734b46f | — | |
| 2026-11-04 | `handlers/overview_test.go` | 73 | 9734e6073c9c | — | |
| 2026-11-04 | `handlers/pod_debug.go` | 30 | 38f02c2124a9 | — | |
| 2026-11-04 | `handlers/pod_debug_test.go` | 17 | 5a8e05e8847b | — | |
| 2026-11-04 | `handlers/pod_exec.go` | 23 | cefec20ed503 | — | |
| 2026-11-04 | `handlers/pod_utils.go` | 8 | a3d9df830860 | — | |
| 2026-11-04 | `handlers/pods.go` | 23 | 6951a764e051 | — | |
| 2026-11-04 | `handlers/pods_test.go` | 338 | 084132ea7003 | — | |
| 2026-11-04 | `handlers/readyz.go` | 6 | 5cbc1825384e | — | |
| 2026-11-04 | `handlers/readyz_test.go` | 2 | 9b846ee1bdbc | — | |
| 2026-11-04 | `handlers/secrets.go` | 8 | 31b98245f028 | — | |
| 2026-11-04 | `handlers/secrets_test.go` | 114 | 3cfa8efdcb0c | — | |
| 2026-11-04 | `internal/argoversioned/pkg/client/clientset/versioned/clientset.go` | 42 | 252545a34f83 | — | |
| 2026-11-04 | `internal/fluxcdversioned/pkg/client/clientset/versioned/clientset.go` | 26 | 4b0154fb038f | — | |
| 2026-11-04 | `internal/fluxcdversioned/pkg/client/clientset/versioned/gitrepository.go` | 16 | 65e4bf8fd822 | — | |
| 2026-11-04 | `main.go` | 9 | da2f62748136 | — | |
| 2026-11-04 | `main_test.go` | 93 | ac172730130d | — | |
| 2026-11-04 | `playwright.config.ts` | 19 | 7d9e93d86b6d | — | |
| 2026-11-04 | `scripts/comment-policy/measure.sh` | 1 | 92ef8c89c302 | 완료 | 유지 1줄(SIGPIPE 함정) — [passes/2026-11-04-infra-and-first-e2e.md](passes/2026-11-04-infra-and-first-e2e.md) |
| 2026-11-04 | `scripts/kind-cluster.sh` | 30 | 22d796afc304 | — | |
| 2026-11-04 | `test/argo_cluster_script_test.sh` | 44 | 588ce9057d08 | — | |
| 2026-11-04 | `test/argo_fixtures_test.go` | 78 | 9316d3cf86d5 | — | |
| 2026-11-04 | `test/backend_helper.go` | 27 | 8fdb43fcd9a6 | — | |
| 2026-11-04 | `test/backend_helper_test.go` | 16 | 1f46c928e5a1 | — | |
| 2026-11-04 | `test/docker_test.sh` | 9 | f94cb514d77e | — | |
| 2026-11-04 | `test/fixtures/apply-all.sh` | 57 | f8cb7563c11f | — | |
| 2026-11-04 | `test/fixtures/fluxcd-mut-fixtures.yaml` | 22 | 269276a39f7d | — | |
| 2026-11-04 | `test/fixtures/mock-policy-mutation-fixtures.yaml` | 4 | 0a3d5c2f3686 | — | |
| 2026-11-04 | `test/fixtures/pd6-hide-completed-fixtures.yaml` | 27 | c125f7e88277 | — | |
| 2026-11-04 | `test/fixtures/secret-mut-fixtures.yaml` | 22 | 43a2fe6c6bd0 | — | |
| 2026-11-04 | `test/fluxcd_cluster_script_test.sh` | 35 | a28f1b53a180 | — | |
| 2026-11-04 | `test/fluxcd_fixtures_test.go` | 69 | 555572ad2cc4 | — | |
| 2026-11-04 | `test/k8s_manifest_test.sh` | 13 | be0dd5c65497 | — | |
| 2026-11-04 | `test/scaffolding_test.sh` | 16 | 0512c583893a | — | |

## 줄 끝·줄 중간 주석 (E)

| 판정일 | 범위 | 현재 줄 수 | 지문 | 판정 | 결과 |
|---|---|---|---|---|---|
| 2026-11-04 | `e2e/bottom-tab-bar.spec.ts` | 6 | af72774bc096 | — | |
| 2026-11-04 | `e2e/configmaps-accordion.spec.ts` | 2 | 52ae44d17510 | — | |
| 2026-11-04 | `e2e/configmaps-tab.spec.ts` | 1 | 7b403c2778ab | — | |
| 2026-11-04 | `e2e/eng/debug-detail-view.spec.ts` | 1 | ec796b9e85b3 | — | |
| 2026-11-04 | `e2e/namespace-favorites.spec.ts` | 1 | f7db4bd42878 | — | |
| 2026-11-04 | `e2e/namespace-filter.spec.ts` | 2 | 4c2b4ed50f9b | — | |
| 2026-11-04 | `e2e/node-quick-view.spec.ts` | 1 | 6dc271b6ba4c | — | |
| 2026-11-04 | `e2e/nodes-data-states.spec.ts` | 1 | e03181b6d434 | — | |
| 2026-11-04 | `e2e/nodes-status-usage.spec.ts` | 3 | dd7ea18ab4b6 | — | |
| 2026-11-04 | `e2e/nodes-tab.spec.ts` | 1 | cbeb36041731 | — | |
| 2026-11-04 | `e2e/pod-logs.spec.ts` | 1 | 3fd919498a06 | — | |
| 2026-11-04 | `e2e/pods.spec.ts` | 4 | b0d449474dcf | — | |
| 2026-11-04 | `e2e/secrets-reveal.spec.ts` | 5 | dcbd189f33fb | — | |
| 2026-11-04 | `e2e/secrets-tab.spec.ts` | 1 | 6d0f7e070917 | — | |
| 2026-11-04 | `frontend/src/api/debugFetch.test.ts` | 1 | ffede8426d1a | — | |
| 2026-11-04 | `frontend/src/components/ArgoTab.test.tsx` | 7 | 9df9b2a53ee3 | — | |
| 2026-11-04 | `frontend/src/components/DebugDetailView.test.tsx` | 4 | bbde6fa595f2 | — | |
| 2026-11-04 | `frontend/src/components/DeploymentCard.tsx` | 3 | 2a660386a115 | — | |
| 2026-11-04 | `frontend/src/components/FluxCDTab.test.tsx` | 2 | 3ab11c27defe | — | |
| 2026-11-04 | `frontend/src/components/KustomizationDetailPage.tsx` | 2 | 74a5b8292a08 | — | |
| 2026-11-04 | `frontend/src/components/NodeCard.test.tsx` | 1 | 9564ddbff7d4 | — | |
| 2026-11-04 | `frontend/src/components/NodeQuickView.test.tsx` | 1 | ad84e96025a8 | — | |
| 2026-11-04 | `frontend/src/components/PodLogPanel.test.tsx` | 1 | 41b723c2efab | — | |
| 2026-11-04 | `frontend/src/components/PodsTab.test.tsx` | 1 | d0b45c8ccf3f | — | |
| 2026-11-04 | `frontend/src/components/PollingIndicator.test.tsx` | 7 | e4b082eb5dff | — | |
| 2026-11-04 | `frontend/src/components/StepIO.test.tsx` | 2 | 94caf43b6ffa | — | |
| 2026-11-04 | `frontend/src/components/UnhealthyPodPreview.test.tsx` | 1 | d2f41b7cd033 | — | |
| 2026-11-04 | `frontend/src/components/UsageBar.tsx` | 3 | 008bb6841e1a | — | |
| 2026-11-04 | `frontend/src/components/WorkloadsTab.test.tsx` | 1 | d6346d45942f | — | |
| 2026-11-04 | `frontend/src/contexts/DebugContext.tsx` | 1 | 2c08def8b2b9 | — | |
| 2026-11-04 | `frontend/src/contexts/FavoritesContext.test.tsx` | 3 | 274ce7ac3625 | — | |
| 2026-11-04 | `handlers/argo_client_test.go` | 3 | 3fb6ad5b8695 | — | |
| 2026-11-04 | `handlers/argo_workflow_detail_handler_test.go` | 1 | d07a6d18e73a | — | |
| 2026-11-04 | `handlers/fluxcd_client_test.go` | 3 | 20de23037a6d | — | |
| 2026-11-04 | `handlers/overview_test.go` | 3 | 1a539181f60c | — | |
| 2026-11-04 | `handlers/pod_debug_test.go` | 1 | 595fa729b80c | — | |
| 2026-11-04 | `handlers/pod_exec.go` | 1 | 9c5165a05f21 | — | |
| 2026-11-04 | `handlers/pods_test.go` | 3 | 7bf3610f1210 | — | |
| 2026-11-04 | `playwright.config.ts` | 1 | 2bb2da5e7a63 | — | |
| 2026-11-04 | `scripts/kind-cluster.sh` | 1 | 4384b0c8ec47 | — | |
| 2026-11-04 | `test/backend_helper.go` | 2 | b85a2e8bbc80 | — | |
| 2026-11-04 | `test/backend_helper_test.go` | 1 | d6a489af9508 | — | |
| 2026-11-04 | `test/fixtures/apply-all.sh` | 1 | 45ab2627c95a | — | |
| 2026-11-04 | `test/scaffolding_test.sh` | 1 | cb0b77cc98fc | — | |

## Python docstring (D)

| 판정일 | 범위 | 현재 줄 수 | 지문 | 판정 | 결과 |
|---|---|---|---|---|---|
