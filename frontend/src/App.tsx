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
import { BottomTabBar, TabType } from './components/BottomTabBar';
import { useNamespace } from './contexts/NamespaceContext';
import { fetchUnhealthyPods } from './api/pods';

function AppContent() {
  // TODO: Replace with React Router when implementing full Pods page
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [unhealthyPodCount, setUnhealthyPodCount] = useState(0);
  const { namespace } = useNamespace();

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync currentTab with currentPath
  useEffect(() => {
    if (currentPath === '/pods') {
      setCurrentTab('pods');
    } else if (currentPath === '/nodes') {
      setCurrentTab('nodes');
    } else if (currentPath === '/workloads') {
      setCurrentTab('workloads');
    } else if (currentPath === '/secrets') {
      setCurrentTab('secrets');
    } else {
      setCurrentTab('overview');
    }
  }, [currentPath]);

  // Fetch unhealthy pod count
  useEffect(() => {
    const loadUnhealthyPodCount = async () => {
      try {
        const pods = await fetchUnhealthyPods(namespace);
        setUnhealthyPodCount(pods.length);
      } catch (error) {
        console.error('Failed to fetch unhealthy pods:', error);
        setUnhealthyPodCount(0);
      }
    };

    loadUnhealthyPodCount();

    // Listen for dashboard refresh events
    const handleRefresh = () => {
      loadUnhealthyPodCount();
    };

    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [namespace]);

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    const pathMap: Record<TabType, string> = {
      overview: '/',
      pods: '/pods',
      nodes: '/nodes',
      workloads: '/workloads',
      secrets: '/secrets',
    };
    const newPath = pathMap[tab];
    window.history.pushState({}, '', newPath);
    setCurrentPath(newPath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
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
      <BottomTabBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        unhealthyPodCount={unhealthyPodCount}
      />
    </div>
  );
}

function App() {
  return (
    <NamespaceProvider>
      <AppContent />
    </NamespaceProvider>
  );
}

export default App;
