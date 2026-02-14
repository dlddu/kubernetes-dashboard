import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NamespaceProvider } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { BottomTabBar } from './components/BottomTabBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';
import { NodeQuickView } from './components/NodeQuickView';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';

function App() {
  const [unhealthyPodCount, _setUnhealthyPodCount] = useState(0);

  // Listen to dashboard refresh events to update pod count
  // This will be populated by the actual pod monitoring logic
  // For now, components can dispatch custom events to update this

  return (
    <BrowserRouter>
      <NamespaceProvider>
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
      </NamespaceProvider>
    </BrowserRouter>
  );
}

export default App;
