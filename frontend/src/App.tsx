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

type TabType = 'overview' | 'nodes' | 'workloads' | 'pods' | 'secrets';

function getInitialTab(): TabType {
  const pathname = window.location.pathname;

  if (pathname === '/' || pathname === '/overview') {
    return 'overview';
  } else if (pathname === '/nodes') {
    return 'nodes';
  } else if (pathname === '/workloads') {
    return 'workloads';
  } else if (pathname === '/pods') {
    return 'pods';
  } else if (pathname === '/secrets') {
    return 'secrets';
  }

  // Default to overview for unknown paths
  return 'overview';
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [unhealthyPodCount, setUnhealthyPodCount] = useState<number>(0);

  useEffect(() => {
    // Listen for pod count updates from UnhealthyPodPreview or other components
    const handlePodCountUpdate = (event: CustomEvent<number>) => {
      setUnhealthyPodCount(event.detail);
    };

    window.addEventListener('unhealthy-pod-count-update', handlePodCountUpdate as EventListener);
    return () => {
      window.removeEventListener('unhealthy-pod-count-update', handlePodCountUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without page reload
    window.history.pushState({}, '', `/${tab === 'overview' ? '' : tab}`);
  };

  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50 pb-20">
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
