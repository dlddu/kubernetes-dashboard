import { useState, useEffect } from 'react';
import { NamespaceProvider } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';
import { NodeQuickView } from './components/NodeQuickView';
import { NodesTab } from './components/NodesTab';
import { WorkloadsTab } from './components/WorkloadsTab';
import { PodsTab } from './components/PodsTab';
import { SecretsTab } from './components/SecretsTab';
import { BottomTabBar } from './components/BottomTabBar';
import { fetchOverview } from './api/overview';

function App() {
  // TODO: Replace with React Router when implementing full Pods page
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [unhealthyPodCount, setUnhealthyPodCount] = useState<number>(0);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch unhealthy pod count for the bottom tab bar badge
  useEffect(() => {
    const loadUnhealthyPodCount = async () => {
      try {
        const data = await fetchOverview();
        setUnhealthyPodCount(data.unhealthyPods);
      } catch (err) {
        // Silent fail - badge will just not show
        console.error('Failed to load unhealthy pod count:', err);
      }
    };

    loadUnhealthyPodCount();

    // Refresh count periodically
    const interval = setInterval(loadUnhealthyPodCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <TopBar />
        <main className="container mx-auto px-4 py-8">
          {currentPath === '/pods' ? (
            <PodsTab />
          ) : currentPath === '/nodes' ? (
            <NodesTab />
          ) : currentPath === '/workloads' ? (
            <WorkloadsTab />
          ) : currentPath === '/secrets' ? (
            <SecretsTab />
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
        <BottomTabBar unhealthyPodCount={unhealthyPodCount} />
      </div>
    </NamespaceProvider>
  );
}

export default App;
