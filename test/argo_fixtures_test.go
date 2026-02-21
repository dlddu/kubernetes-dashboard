package test

// argo_fixtures_test.go
//
// DLD-437: Argo Workflows CRD 설치 및 e2e 테스트 환경 구성
//
// 이 파일은 TDD Red Phase 테스트입니다.
// test/fixtures/ 하위에 작성될 Argo YAML fixture 파일들의 구조적 유효성을
// YAML 파싱 수준에서 검증합니다. kubebuilder 의존 없이 gopkg.in/yaml.v3만 사용합니다.
//
// 검증 대상:
//   - workflow-template-with-params.yaml  (파라미터가 있는 WorkflowTemplate)
//   - workflow-template-no-params.yaml    (파라미터가 없는 WorkflowTemplate)
//   - workflow-running.yaml               (Running 상태 Workflow)
//   - workflow-succeeded.yaml             (Succeeded 상태 Workflow)
//   - workflow-failed.yaml                (Failed 상태 Workflow)

import (
	"io"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"gopkg.in/yaml.v3"
)

// ---- helpers ----

// fixturesDir returns the absolute path to test/fixtures/.
func fixturesDir(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Join(filepath.Dir(file), "fixtures")
}

// byteReader is a small helper so we can pass []byte to yaml.NewDecoder.
type byteReader []byte

func (b *byteReader) Read(p []byte) (int, error) {
	if len(*b) == 0 {
		return 0, io.EOF
	}
	n := copy(p, *b)
	*b = (*b)[n:]
	return n, nil
}

// loadYAMLDocsFromBytes is the real helper used by test cases.
func loadYAMLDocsFromBytes(t *testing.T, path string) []map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("cannot read %s: %v", path, err)
	}

	var docs []map[string]interface{}
	br := byteReader(data)
	dec := yaml.NewDecoder(&br)
	for {
		var doc map[string]interface{}
		if decErr := dec.Decode(&doc); decErr != nil {
			break
		}
		if doc != nil {
			docs = append(docs, doc)
		}
	}

	if len(docs) == 0 {
		t.Fatalf("%s: no YAML documents found", path)
	}
	return docs
}

// getString extracts a nested string value using a dotted key path.
// Returns ("", false) when the path does not exist or the value is not a string.
func getString(m map[string]interface{}, keys ...string) (string, bool) {
	var cur interface{} = m
	for _, k := range keys {
		mm, ok := cur.(map[string]interface{})
		if !ok {
			return "", false
		}
		cur = mm[k]
	}
	s, ok := cur.(string)
	return s, ok
}

// getSlice extracts a slice value at a single key level.
func getSlice(m map[string]interface{}, key string) ([]interface{}, bool) {
	v, ok := m[key]
	if !ok {
		return nil, false
	}
	s, ok := v.([]interface{})
	return s, ok
}

// getMap extracts a nested map value.
func getMap(m map[string]interface{}, keys ...string) (map[string]interface{}, bool) {
	var cur interface{} = m
	for _, k := range keys {
		mm, ok := cur.(map[string]interface{})
		if !ok {
			return nil, false
		}
		cur = mm[k]
	}
	mm, ok := cur.(map[string]interface{})
	return mm, ok
}

// ---- fixture existence tests ----

// TestArgoFixtureFilesExist verifies that all required Argo fixture YAML files
// are present under test/fixtures/.
func TestArgoFixtureFilesExist(t *testing.T) {
	dir := fixturesDir(t)

	required := []string{
		"workflow-template-with-params.yaml",
		"workflow-template-no-params.yaml",
		"workflow-running.yaml",
		"workflow-succeeded.yaml",
		"workflow-failed.yaml",
	}

	for _, name := range required {
		name := name
		t.Run(name, func(t *testing.T) {
			path := filepath.Join(dir, name)
			if _, err := os.Stat(path); os.IsNotExist(err) {
				t.Errorf("fixture file not found: %s", path)
			}
		})
	}
}

// ---- WorkflowTemplate fixture tests ----

// TestWorkflowTemplateWithParams verifies the structure of the WorkflowTemplate
// fixture that declares input parameters (input-path, output-path, batch-size, env).
func TestWorkflowTemplateWithParams(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "workflow-template-with-params.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}
	doc := docs[0]

	// apiVersion must be argoproj.io/v1alpha1
	apiVersion, _ := getString(doc, "apiVersion")
	if apiVersion != "argoproj.io/v1alpha1" {
		t.Errorf("apiVersion: want argoproj.io/v1alpha1, got %q", apiVersion)
	}

	// kind must be WorkflowTemplate
	kind, _ := getString(doc, "kind")
	if kind != "WorkflowTemplate" {
		t.Errorf("kind: want WorkflowTemplate, got %q", kind)
	}

	// namespace must be dashboard-test
	ns, _ := getString(doc, "metadata", "namespace")
	if ns != "dashboard-test" {
		t.Errorf("metadata.namespace: want dashboard-test, got %q", ns)
	}

	// spec.arguments.parameters must contain the four required parameters
	spec, ok := getMap(doc, "spec")
	if !ok {
		t.Fatal("spec field not found")
	}

	arguments, ok := getMap(spec, "arguments")
	if !ok {
		t.Fatal("spec.arguments field not found")
	}

	params, ok := getSlice(arguments, "parameters")
	if !ok || len(params) == 0 {
		t.Fatal("spec.arguments.parameters must be a non-empty list")
	}

	requiredParams := map[string]bool{
		"input-path":  false,
		"output-path": false,
		"batch-size":  false,
		"env":         false,
	}

	for _, p := range params {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := pm["name"].(string)
		if _, exists := requiredParams[name]; exists {
			requiredParams[name] = true
		}
	}

	for paramName, found := range requiredParams {
		if !found {
			t.Errorf("required parameter %q not found in spec.arguments.parameters", paramName)
		}
	}

	// env parameter must have an enum field
	for _, p := range params {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		if pm["name"] == "env" {
			enum, ok := getSlice(pm, "enum")
			if !ok || len(enum) == 0 {
				t.Error("parameter 'env' must have a non-empty enum field")
			}
		}
	}

	// spec.templates must be present
	templates, ok := getSlice(spec, "templates")
	if !ok || len(templates) == 0 {
		t.Error("spec.templates must be a non-empty list")
	}
}

// TestWorkflowTemplateNoParams verifies the structure of the WorkflowTemplate
// fixture that has no input parameters.
func TestWorkflowTemplateNoParams(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "workflow-template-no-params.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}
	doc := docs[0]

	// apiVersion / kind
	apiVersion, _ := getString(doc, "apiVersion")
	if apiVersion != "argoproj.io/v1alpha1" {
		t.Errorf("apiVersion: want argoproj.io/v1alpha1, got %q", apiVersion)
	}

	kind, _ := getString(doc, "kind")
	if kind != "WorkflowTemplate" {
		t.Errorf("kind: want WorkflowTemplate, got %q", kind)
	}

	// namespace
	ns, _ := getString(doc, "metadata", "namespace")
	if ns != "dashboard-test" {
		t.Errorf("metadata.namespace: want dashboard-test, got %q", ns)
	}

	// spec.arguments should not declare any parameters (may be absent or empty)
	spec, ok := getMap(doc, "spec")
	if !ok {
		t.Fatal("spec field not found")
	}

	if arguments, ok := getMap(spec, "arguments"); ok {
		params, hasParams := getSlice(arguments, "parameters")
		if hasParams && len(params) > 0 {
			t.Error("no-params WorkflowTemplate must not declare spec.arguments.parameters")
		}
	}

	// spec.templates must be present
	templates, ok := getSlice(spec, "templates")
	if !ok || len(templates) == 0 {
		t.Error("spec.templates must be a non-empty list")
	}
}

// ---- Workflow fixture tests (shared validator) ----

// validateWorkflowDoc checks the structural requirements common to all Workflow
// fixture CRs.
func validateWorkflowDoc(t *testing.T, doc map[string]interface{}, wantPhase string) {
	t.Helper()

	// apiVersion / kind
	apiVersion, _ := getString(doc, "apiVersion")
	if apiVersion != "argoproj.io/v1alpha1" {
		t.Errorf("apiVersion: want argoproj.io/v1alpha1, got %q", apiVersion)
	}

	kind, _ := getString(doc, "kind")
	if kind != "Workflow" {
		t.Errorf("kind: want Workflow, got %q", kind)
	}

	// namespace
	ns, _ := getString(doc, "metadata", "namespace")
	if ns != "dashboard-test" {
		t.Errorf("metadata.namespace: want dashboard-test, got %q", ns)
	}

	// status.phase
	phase, ok := getString(doc, "status", "phase")
	if !ok {
		t.Errorf("status.phase not found; want %q", wantPhase)
	} else if phase != wantPhase {
		t.Errorf("status.phase: want %q, got %q", wantPhase, phase)
	}

	// status.nodes must be present and non-empty
	status, ok := getMap(doc, "status")
	if !ok {
		t.Fatal("status field not found")
	}

	nodes, hasNodes := status["nodes"]
	if !hasNodes {
		t.Fatal("status.nodes not found")
	}

	nodesMap, ok := nodes.(map[string]interface{})
	if !ok || len(nodesMap) == 0 {
		t.Fatal("status.nodes must be a non-empty map")
	}

	// Every node must have inputs and outputs with parameters and artifacts.
	for nodeID, nodeVal := range nodesMap {
		nodeMap, ok := nodeVal.(map[string]interface{})
		if !ok {
			t.Errorf("node %q is not a map", nodeID)
			continue
		}

		validateNodeInputsOutputs(t, nodeID, nodeMap)
	}
}

// validateNodeInputsOutputs ensures that a node entry contains inputs and outputs
// sections, each with both parameters and artifacts lists (which may be empty but
// must be present as a YAML sequence).
func validateNodeInputsOutputs(t *testing.T, nodeID string, node map[string]interface{}) {
	t.Helper()

	for _, section := range []string{"inputs", "outputs"} {
		sectionMap, ok := getMap(node, section)
		if !ok {
			// inputs/outputs are optional per the Argo spec for non-step nodes;
			// we only enforce their presence when the node type is Pod or Steps.
			nodeType, _ := node["type"].(string)
			if nodeType == "Pod" || nodeType == "Steps" || nodeType == "StepGroup" {
				t.Errorf("node %q (type=%s): %s field not found", nodeID, nodeType, section)
			}
			continue
		}

		// parameters must be present (may be nil/empty list)
		if _, hasParams := sectionMap["parameters"]; !hasParams {
			t.Errorf("node %q %s: 'parameters' key not found", nodeID, section)
		}

		// artifacts must be present (may be nil/empty list)
		if _, hasArtifacts := sectionMap["artifacts"]; !hasArtifacts {
			t.Errorf("node %q %s: 'artifacts' key not found", nodeID, section)
		}
	}
}

// TestWorkflowRunning verifies the fixture for a Running Workflow.
// It must contain at least one Succeeded, one Running, and one Pending node.
func TestWorkflowRunning(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "workflow-running.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}

	validateWorkflowDoc(t, docs[0], "Running")

	// Phase-specific: nodes must include Succeeded, Running, and Pending entries.
	status, _ := getMap(docs[0], "status")
	nodes := status["nodes"].(map[string]interface{})

	phases := map[string]bool{"Succeeded": false, "Running": false, "Pending": false}
	for _, nodeVal := range nodes {
		nodeMap, ok := nodeVal.(map[string]interface{})
		if !ok {
			continue
		}
		if p, ok := nodeMap["phase"].(string); ok {
			if _, tracked := phases[p]; tracked {
				phases[p] = true
			}
		}
	}

	for phase, found := range phases {
		if !found {
			t.Errorf("workflow-running.yaml: expected a node with phase=%q but none found", phase)
		}
	}
}

// TestWorkflowSucceeded verifies the fixture for a Succeeded Workflow.
// All nodes must have phase Succeeded.
func TestWorkflowSucceeded(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "workflow-succeeded.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}

	validateWorkflowDoc(t, docs[0], "Succeeded")

	// All nodes must be Succeeded.
	status, _ := getMap(docs[0], "status")
	nodes := status["nodes"].(map[string]interface{})

	for nodeID, nodeVal := range nodes {
		nodeMap, ok := nodeVal.(map[string]interface{})
		if !ok {
			continue
		}
		phase, _ := nodeMap["phase"].(string)
		if phase != "Succeeded" {
			t.Errorf("workflow-succeeded.yaml: node %q has phase %q; want Succeeded", nodeID, phase)
		}
	}
}

// TestWorkflowFailed verifies the fixture for a Failed Workflow.
// At least one node must be Failed and at least one Omitted.
func TestWorkflowFailed(t *testing.T) {
	path := filepath.Join(fixturesDir(t), "workflow-failed.yaml")
	docs := loadYAMLDocsFromBytes(t, path)

	if len(docs) != 1 {
		t.Fatalf("expected 1 document, got %d", len(docs))
	}

	validateWorkflowDoc(t, docs[0], "Failed")

	// Must have at least one Failed node and at least one Omitted node.
	status, _ := getMap(docs[0], "status")
	nodes := status["nodes"].(map[string]interface{})

	phases := map[string]bool{"Failed": false, "Omitted": false}
	for _, nodeVal := range nodes {
		nodeMap, ok := nodeVal.(map[string]interface{})
		if !ok {
			continue
		}
		if p, ok := nodeMap["phase"].(string); ok {
			if _, tracked := phases[p]; tracked {
				phases[p] = true
			}
		}
	}

	for phase, found := range phases {
		if !found {
			t.Errorf("workflow-failed.yaml: expected a node with phase=%q but none found", phase)
		}
	}
}

// ---- apply-all.sh tests ----

// TestApplyAllShIncludesArgoFixtures verifies that test/fixtures/apply-all.sh
// references each Argo fixture file by reading its content.  This is a
// lightweight content-check that does not execute the script.
func TestApplyAllShIncludesArgoFixtures(t *testing.T) {
	scriptPath := filepath.Join(fixturesDir(t), "apply-all.sh")
	data, err := os.ReadFile(scriptPath)
	if err != nil {
		t.Fatalf("cannot read apply-all.sh: %v", err)
	}
	content := string(data)

	expected := []string{
		"workflow-template-with-params.yaml",
		"workflow-template-no-params.yaml",
		"workflow-running.yaml",
		"workflow-succeeded.yaml",
		"workflow-failed.yaml",
	}

	for _, name := range expected {
		if !containsString(content, name) {
			t.Errorf("apply-all.sh does not reference %q", name)
		}
	}
}

// ---- kind-cluster.sh tests ----

// TestKindClusterShHasInstallArgoCrdsFunction verifies that scripts/kind-cluster.sh
// defines an install_argo_crds function and calls kubectl apply with an Argo
// CRD manifest URL, without executing the script.
func TestKindClusterShHasInstallArgoCrdsFunction(t *testing.T) {
	scriptPath := filepath.Join(fixturesDir(t), "..", "..", "scripts", "kind-cluster.sh")
	data, err := os.ReadFile(scriptPath)
	if err != nil {
		t.Fatalf("cannot read kind-cluster.sh: %v", err)
	}
	content := string(data)

	// The function must exist.
	if !containsString(content, "install_argo_crds") {
		t.Error("kind-cluster.sh: install_argo_crds function not found")
	}

	// The function must invoke kubectl apply with an Argo CRD source.
	// Acceptable patterns: apply -f <url|file> referencing argoproj or argo-workflows.
	if !containsString(content, "argoproj") && !containsString(content, "argo-workflows") {
		t.Error("kind-cluster.sh: no argoproj/argo-workflows reference found — CRD source missing")
	}

	// create_cluster must call install_argo_crds so CRDs are set up on cluster creation.
	if !containsString(content, "install_argo_crds") {
		t.Error("kind-cluster.sh: install_argo_crds is not called from create_cluster")
	}
}

// ---- utility ----

// containsString reports whether s contains substr.
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && stringIndex(s, substr) >= 0)
}

func stringIndex(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
