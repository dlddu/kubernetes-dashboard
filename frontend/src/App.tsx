import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NamespaceProvider, useNamespace } from './contexts/NamespaceContext';
import { DebugProvider } from './contexts/DebugContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { PollingProvider } from './contexts/PollingContext';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { TopBar } from './components/TopBar';
import { BottomTabBar } from './components/BottomTabBar';
import { OverviewTab } from './components/OverviewTab';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';
import { DebugPage } from './components/DebugPage';

function AppContent() {
  const { selectedNamespace } = useNamespace();
  const { overviewData } = useDashboard();

  const namespaceParam = selectedNamespace === 'all' ? undefined : selectedNamespace;
  const unhealthyPodCount = overviewData?.unhealthyPods ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopBar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<OverviewTab />} />
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
