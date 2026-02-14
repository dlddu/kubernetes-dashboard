import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NamespaceProvider, useNamespace } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { BottomTabBar } from './components/BottomTabBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';
import { NodeQuickView } from './components/NodeQuickView';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';
import { fetchUnhealthyPods } from './api/pods';

function AppContent() {
  const { selectedNamespace } = useNamespace();
  const [unhealthyPodCount, setUnhealthyPodCount] = useState(0);

  useEffect(() => {
    const loadUnhealthyPodCount = async () => {
      try {
        const ns = selectedNamespace === 'all' ? '' : selectedNamespace;
        const pods = await fetchUnhealthyPods(ns);
        setUnhealthyPodCount(pods.length);
      } catch (error) {
        console.error('Failed to fetch unhealthy pods:', error);
      }
    };

    loadUnhealthyPodCount();
    const interval = setInterval(loadUnhealthyPodCount, 30000);
    return () => clearInterval(interval);
  }, [selectedNamespace]);

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
          <Route path="/workloads" element={<WorkloadsTab />} />
          <Route path="/pods" element={<PodsTab />} />
          <Route path="/pods/*" element={<PodsTab />} />
          <Route path="/secrets" element={<SecretsTab />} />
        </Routes>
      </main>
      <BottomTabBar unhealthyPodCount={unhealthyPodCount} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NamespaceProvider>
        <AppContent />
      </NamespaceProvider>
    </BrowserRouter>
  );
}

export default App;
