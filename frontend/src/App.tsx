import { useState, useEffect } from 'react';
import { NamespaceProvider } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';
import { NodeQuickView } from './components/NodeQuickView';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';

function App() {
  // TODO: Replace with React Router when implementing full Pods page
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <main className="container mx-auto px-4 py-8">
          {currentPath === '/pods' ? (
            <PodsTab />
          ) : currentPath === '/nodes' ? (
            <NodesTab />
          ) : currentPath === '/workloads' ? (
            <WorkloadsTab />
          ) : (
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
          )}
        </main>
      </div>
    </NamespaceProvider>
  );
}

export default App;
