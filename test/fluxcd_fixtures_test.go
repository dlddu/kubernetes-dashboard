package test

// fluxcd_fixtures_test.go
//
// DLD-743: e2e 테스트 환경에 FluxCD CRD 등록
//
// 이 파일은 TDD Red Phase 테스트입니다.
// test/fixtures/ 하위에 작성될 FluxCD Kustomization YAML fixture 파일들의
// 구조적 유효성을 YAML 파싱 수준에서 검증합니다.
// kubebuilder 의존 없이 gopkg.in/yaml.v3만 사용합니다.
//
// 검증 대상:
//   - kustomization-ready.yaml       (Ready 상태 Kustomization)
//   - kustomization-not-ready.yaml   (Not Ready 상태 Kustomization)
//   - kustomization-suspended.yaml   (Suspended 상태 Kustomization)
//   - kustomization-multi-ns.yaml    (다중 네임스페이스 Kustomization)
//
// 참고: helper 함수들(fixturesDir, loadYAMLDocsFromBytes, getString, getSlice,
// getMap, containsString, stringIndex)은 argo_fixtures_test.go에 정의되어 있으며
// 같은 package test이므로 여기서 재사용합니다.

import (
	"os"
	"path/filepath"
	"testing"
)

// fluxCDFixturesDir은 FluxCD fixture 파일 목록을 반환합니다.
// 존재 여부 테스트 및 반복 검증에 사용됩니다.
var fluxCDFixtureFiles = []string{
	"kustomization-ready.yaml",
	"kustomization-not-ready.yaml",
	"kustomization-suspended.yaml",
	"kustomization-multi-ns.yaml",
}

// ---- fixture existence tests ----

// TestFluxCDFixtureFilesExist verifies that all required FluxCD fixture YAML files
// are present under test/fixtures/.
func TestFluxCDFixtureFilesExist(t *testing.T) {
	dir := fixturesDir(t)

	for _, name := range fluxCDFixtureFiles {
		name := name
		t.Run(name, func(t *testing.T) {
			path := filepath.Join(dir, name)
			if _, err := os.Stat(path); os.IsNotExist(err) {
				t.Errorf("fixture file not found: %s", path)
			}
		})
	}
}

// ---- shared validator ----

// validateKustomizationDoc checks the structural requirements common to all
// FluxCD Kustomization fixture CRs.
func validateKustomizationDoc(t *testing.T, doc map[string]interface{}, wantNamespace string) {
	t.Helper()

	// apiVersion must be kustomize.toolkit.fluxcd.io/v1
	apiVersion, _ := getString(doc, "apiVersion")
	if apiVersion != "kustomize.toolkit.fluxcd.io/v1" {
		t.Errorf("apiVersion: want kustomize.toolkit.fluxcd.io/v1, got %q", apiVersion)
	}

	// kind must be Kustomization
	kind, _ := getString(doc, "kind")
	if kind != "Kustomization" {
		t.Errorf("kind: want Kustomization, got %q", kind)
	}

	// namespace must match expected value
	ns, _ := getString(doc, "metadata", "namespace")
	if ns != wantNamespace {
		t.Errorf("metadata.namespace: want %q, got %q", wantNamespace, ns)
	}
}

// validateKustomizationSpec checks that the spec contains the required FluxCD
// Kustomization fields: interval, path, prune, sourceRef.
func validateKustomizationSpec(t *testing.T, doc map[string]interface{}) {
	t.Helper()

	spec, ok := getMap(doc, "spec")
	if !ok {
		t.Fatal("spec field not found")
	}

	// spec.interval must be present
	if _, hasInterval := spec["interval"]; !hasInterval {
		t.Error("spec.interval not found")
	}

	// spec.path must be present
	if _, hasPath := spec["path"]; !hasPath {
		t.Error("spec.path not found")
	}

	// spec.prune must be present
	if _, hasPrune := spec["prune"]; !hasPrune {
		t.Error("spec.prune not found")
	}

	// spec.sourceRef must be present and be a map
	if _, ok := getMap(spec, "sourceRef"); !ok {
		t.Error("spec.sourceRef not found or not a map")
	}
}

// ---- Kustomization fixture tests ----

// TestKustomizationReady verifies the fixture for a Ready state Kustomization.
func TestKustomizationReady(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "kustomization-ready.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}
	doc := docs[0]

	// Validate common fields
	validateKustomizationDoc(t, doc, "dashboard-test")

	// Validate spec fields
	validateKustomizationSpec(t, doc)

	// status.conditions must contain type=Ready with status=True
	status, ok := getMap(doc, "status")
	if !ok {
		t.Fatal("status field not found")
	}

	conditions, ok := getSlice(status, "conditions")
	if !ok || len(conditions) == 0 {
		t.Fatal("status.conditions must be a non-empty list")
	}

	foundReady := false
	for _, c := range conditions {
		cm, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		condType, _ := cm["type"].(string)
		condStatus, _ := cm["status"].(string)
		if condType == "Ready" && condStatus == "True" {
			foundReady = true
		}
	}

	if !foundReady {
		t.Error("status.conditions: no condition with type=Ready and status=True found")
	}

	// status.lastAppliedRevision must be present
	if _, hasRev := status["lastAppliedRevision"]; !hasRev {
		t.Error("status.lastAppliedRevision not found")
	}
}

// TestKustomizationNotReady verifies the fixture for a Not Ready state Kustomization.
func TestKustomizationNotReady(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "kustomization-not-ready.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}
	doc := docs[0]

	// Validate common fields
	validateKustomizationDoc(t, doc, "dashboard-test")

	// status.conditions must contain type=Ready with status=False
	status, ok := getMap(doc, "status")
	if !ok {
		t.Fatal("status field not found")
	}

	conditions, ok := getSlice(status, "conditions")
	if !ok || len(conditions) == 0 {
		t.Fatal("status.conditions must be a non-empty list")
	}

	foundNotReady := false
	for _, c := range conditions {
		cm, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		condType, _ := cm["type"].(string)
		condStatus, _ := cm["status"].(string)
		if condType == "Ready" && condStatus == "False" {
			foundNotReady = true

			// condition must have reason field
			if _, hasReason := cm["reason"]; !hasReason {
				t.Error("Not Ready condition is missing 'reason' field")
			}

			// condition must have message field
			if _, hasMessage := cm["message"]; !hasMessage {
				t.Error("Not Ready condition is missing 'message' field")
			}
		}
	}

	if !foundNotReady {
		t.Error("status.conditions: no condition with type=Ready and status=False found")
	}
}

// TestKustomizationSuspended verifies the fixture for a Suspended state Kustomization.
func TestKustomizationSuspended(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "kustomization-suspended.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}
	doc := docs[0]

	// Validate common fields
	validateKustomizationDoc(t, doc, "dashboard-test")

	// spec.suspend must be true
	spec, ok := getMap(doc, "spec")
	if !ok {
		t.Fatal("spec field not found")
	}

	suspend, hasSuspend := spec["suspend"]
	if !hasSuspend {
		t.Error("spec.suspend not found")
	} else {
		suspendBool, ok := suspend.(bool)
		if !ok || !suspendBool {
			t.Errorf("spec.suspend: want true, got %v", suspend)
		}
	}

	// status.conditions must contain a type=Ready condition
	status, ok := getMap(doc, "status")
	if !ok {
		t.Fatal("status field not found")
	}

	conditions, ok := getSlice(status, "conditions")
	if !ok || len(conditions) == 0 {
		t.Fatal("status.conditions must be a non-empty list")
	}

	foundReadyCondition := false
	for _, c := range conditions {
		cm, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		condType, _ := cm["type"].(string)
		if condType == "Ready" {
			foundReadyCondition = true
		}
	}

	if !foundReadyCondition {
		t.Error("status.conditions: no condition with type=Ready found")
	}
}

// TestKustomizationMultiNamespace verifies the fixture for Kustomizations spread
// across multiple namespaces (dashboard-test and dashboard-empty).
func TestKustomizationMultiNamespace(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "kustomization-multi-ns.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	// File must contain multiple YAML documents (separated by ---)
	if len(docs) < 2 {
		t.Fatalf("kustomization-multi-ns.yaml: expected multiple documents (---), got %d", len(docs))
	}

	// Collect all namespaces from the documents
	namespacesFound := map[string]bool{}
	for i, doc := range docs {
		// Each document must be a valid Kustomization
		apiVersion, _ := getString(doc, "apiVersion")
		if apiVersion != "kustomize.toolkit.fluxcd.io/v1" {
			t.Errorf("doc[%d]: apiVersion: want kustomize.toolkit.fluxcd.io/v1, got %q", i, apiVersion)
		}

		kind, _ := getString(doc, "kind")
		if kind != "Kustomization" {
			t.Errorf("doc[%d]: kind: want Kustomization, got %q", i, kind)
		}

		ns, _ := getString(doc, "metadata", "namespace")
		namespacesFound[ns] = true
	}

	// Both dashboard-test and dashboard-empty must be present
	requiredNamespaces := []string{"dashboard-test", "dashboard-empty"}
	for _, ns := range requiredNamespaces {
		if !namespacesFound[ns] {
			t.Errorf("kustomization-multi-ns.yaml: namespace %q not found in any document", ns)
		}
	}
}

// ---- apply-all.sh tests ----

// TestApplyAllShIncludesFluxCDFixtures verifies that test/fixtures/apply-all.sh
// references each FluxCD fixture file by reading its content. This is a
// lightweight content-check that does not execute the script.
func TestApplyAllShIncludesFluxCDFixtures(t *testing.T) {
	scriptPath := filepath.Join(fixturesDir(t), "apply-all.sh")
	data, err := os.ReadFile(scriptPath)
	if err != nil {
		t.Fatalf("cannot read apply-all.sh: %v", err)
	}
	content := string(data)

	for _, name := range fluxCDFixtureFiles {
		if !containsString(content, name) {
			t.Errorf("apply-all.sh does not reference %q", name)
		}
	}
}

// ---- kind-cluster.sh tests ----

// TestKindClusterShHasInstallFluxCDCrdsFunction verifies that scripts/kind-cluster.sh
// defines an install_fluxcd_crds function and that create_cluster calls it,
// without executing the script.
func TestKindClusterShHasInstallFluxCDCrdsFunction(t *testing.T) {
	scriptPath := filepath.Join(fixturesDir(t), "..", "..", "scripts", "kind-cluster.sh")
	data, err := os.ReadFile(scriptPath)
	if err != nil {
		t.Fatalf("cannot read kind-cluster.sh: %v", err)
	}
	content := string(data)

	// The install_fluxcd_crds function must be defined.
	if !containsString(content, "install_fluxcd_crds") {
		t.Error("kind-cluster.sh: install_fluxcd_crds function not found")
	}

	// The function must invoke kubectl apply with a FluxCD CRD source.
	// Acceptable patterns: apply -f <url|file> referencing fluxcd or
	// kustomize.toolkit.fluxcd.io.
	if !containsString(content, "fluxcd") && !containsString(content, "kustomize.toolkit.fluxcd.io") {
		t.Error("kind-cluster.sh: no fluxcd/kustomize.toolkit.fluxcd.io reference found — CRD source missing")
	}

	// create_cluster must call install_fluxcd_crds so CRDs are set up on cluster creation.
	if !containsString(content, "install_fluxcd_crds") {
		t.Error("kind-cluster.sh: install_fluxcd_crds is not called from create_cluster")
	}
}
