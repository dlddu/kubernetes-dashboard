import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { NamespaceProvider, useNamespace } from './contexts/NamespaceContext';
import { DebugProvider } from './contexts/DebugContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { PollingProvider } from './contexts/PollingContext';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { ALL_NAMESPACES } from './utils/namespacePath';
import { TopBar } from './components/TopBar';
import { BottomTabBar } from './components/BottomTabBar';
import { OverviewTab } from './components/OverviewTab';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';
import { ConfigMapsTab } from './components/ConfigMapsTab';
import { ExternalSecretsTab } from './components/ExternalSecretsTab';
import { ArgoTab } from './components/ArgoTab';
import { FluxCDTab } from './components/FluxCDTab';
import { KustomizationDetailPage } from './components/KustomizationDetailPage';
import { GitRepositoryDetailPage } from './components/GitRepositoryDetailPage';
import { DebugPage } from './components/DebugPage';

// FluxCD detail pages moved to kube-style /namespaces/<ns>/fluxcd/... paths;
// redirect the legacy /fluxcd/<kind>/<ns>/<name> form to keep old links alive.
function LegacyFluxCDDetailRedirect({ kind }: { kind: 'kustomization' | 'gitrepository' }) {
  const { namespace, name } = useParams();
  return <Navigate to={`/namespaces/${namespace}/fluxcd/${kind}/${name}`} replace />;
}

// Tab route table. Mounted at the root and under /namespaces/:namespace so
// every namespaced view is addressable as a kube-style deep link
// (/namespaces/<ns>/pods), while cluster-scoped views stay unprefixed.
function TabRoutes() {
  const { selectedNamespace } = useNamespace();

  const namespaceParam = selectedNamespace === ALL_NAMESPACES ? undefined : selectedNamespace;

  return (
    <Routes>
      <Route path="/" element={<OverviewTab />} />
      <Route path="/nodes" element={<NodesTab />} />
      <Route path="/workloads" element={<WorkloadsTab namespace={namespaceParam} />} />
      <Route path="/pods" element={<PodsTab namespace={namespaceParam} />} />
      <Route path="/pods/*" element={<PodsTab namespace={namespaceParam} />} />
      <Route path="/secrets" element={<SecretsTab namespace={namespaceParam} />} />
      <Route path="/configmaps" element={<ConfigMapsTab namespace={namespaceParam} />} />
      <Route path="/external-secrets" element={<ExternalSecretsTab namespace={namespaceParam} />} />
      <Route path="/argo/*" element={<ArgoTab namespace={namespaceParam} />} />
      <Route path="/flux" element={<FluxCDTab namespace={namespaceParam} />} />
      <Route
        path="/fluxcd/kustomization/:namespace/:name"
        element={<LegacyFluxCDDetailRedirect kind="kustomization" />}
      />
      <Route
        path="/fluxcd/gitrepository/:namespace/:name"
        element={<LegacyFluxCDDetailRedirect kind="gitrepository" />}
      />
      <Route path="/debug" element={<DebugPage />} />
    </Routes>
  );
}

function AppContent() {
  const { overviewData } = useDashboard();

  const unhealthyPodCount = overviewData?.unhealthyPods ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* FluxCD detail: the namespace segment pins the resource itself */}
          <Route
            path="/namespaces/:namespace/fluxcd/kustomization/:name"
            element={<KustomizationDetailPage />}
          />
          <Route
            path="/namespaces/:namespace/fluxcd/gitrepository/:name"
            element={<GitRepositoryDetailPage />}
          />
          <Route path="/namespaces/:namespace/*" element={<TabRoutes />} />
          <Route path="*" element={<TabRoutes />} />
        </Routes>
      </main>
      <BottomTabBar unhealthyPodCount={unhealthyPodCount} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DebugProvider>
        <NamespaceProvider>
          <FavoritesProvider>
            <PollingProvider>
              <DashboardProvider>
                <AppContent />
              </DashboardProvider>
            </PollingProvider>
          </FavoritesProvider>
        </NamespaceProvider>
      </DebugProvider>
    </BrowserRouter>
  );
}

export default App;
