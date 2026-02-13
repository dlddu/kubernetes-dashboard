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
import { fetchUnhealthyPods } from './api/pods';

type Tab = 'overview' | 'nodes' | 'workloads' | 'pods' | 'secrets';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [unhealthyPodCount, setUnhealthyPodCount] = useState<number>(0);

  // Fetch unhealthy pod count for badge
  useEffect(() => {
    const loadUnhealthyPodCount = async () => {
      try {
        const pods = await fetchUnhealthyPods();
        setUnhealthyPodCount(pods.length);
      } catch {
        // Silently fail - badge just won't show
      }
    };

    loadUnhealthyPodCount();
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnhealthyPodCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Update URL without full page reload
    window.history.pushState({}, '', `/${tab === 'overview' ? '' : tab}`);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || 'overview';
      setActiveTab(path as Tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set initial tab from URL
  useEffect(() => {
    const path = window.location.pathname.slice(1) || 'overview';
    setActiveTab(path as Tab);
  }, []);

  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50 pb-16">
        <TopBar />
        <main className="container mx-auto px-4 py-8">
          {activeTab === 'overview' && (
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
          {activeTab === 'nodes' && <NodesTab />}
          {activeTab === 'workloads' && <WorkloadsTab />}
          {activeTab === 'pods' && <PodsTab />}
          {activeTab === 'secrets' && <SecretsTab />}
        </main>
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unhealthyPodCount={unhealthyPodCount}
        />
      </div>
    </NamespaceProvider>
  );
}

export default App;
