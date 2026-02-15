import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NamespaceProvider, useNamespace } from './contexts/NamespaceContext';
import { DebugProvider } from './contexts/DebugContext';
import { PollingProvider } from './contexts/PollingContext';
import { OverviewProvider, useOverview } from './contexts/OverviewContext';
import { TopBar } from './components/TopBar';
import { BottomTabBar } from './components/BottomTabBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';
import { NodeQuickView } from './components/NodeQuickView';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';
import { DebugPage } from './components/DebugPage';

function AppContent() {
  const { selectedNamespace } = useNamespace();
  const { overviewData } = useOverview();

  const namespaceParam = selectedNamespace === 'all' ? undefined : selectedNamespace;
  const unhealthyPodCount = overviewData?.unhealthyPods ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <div data-testid="overview-tab" className="space-y-6">
                <SummaryCards />
                <UnhealthyPodPreview />
                <NodeQuickView />
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">
                    Welcome to the Kubernetes Dashboard. This is a modern web interface for managing Kubernetes clusters.
                  </p>
                </div>
              </div>
            }
          />
          <Route path="/nodes" element={<NodesTab />} />
          <Route path="/workloads" element={<WorkloadsTab namespace={namespaceParam} />} />
          <Route path="/pods" element={<PodsTab namespace={namespaceParam} />} />
          <Route path="/pods/*" element={<PodsTab namespace={namespaceParam} />} />
          <Route path="/secrets" element={<SecretsTab namespace={namespaceParam} />} />
          <Route path="/debug" element={<DebugPage />} />
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
          <PollingProvider>
            <OverviewProvider>
              <AppContent />
            </OverviewProvider>
          </PollingProvider>
        </NamespaceProvider>
      </DebugProvider>
    </BrowserRouter>
  );
}

export default App;
