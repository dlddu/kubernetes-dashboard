interface BottomTabBarProps {
  activeTab: 'overview' | 'nodes' | 'workloads' | 'pods' | 'secrets';
  onTabChange: (tab: 'overview' | 'nodes' | 'workloads' | 'pods' | 'secrets') => void;
  unhealthyPodCount?: number;
}

export function BottomTabBar({ activeTab, onTabChange, unhealthyPodCount }: BottomTabBarProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'nodes' as const, label: 'Nodes' },
    { id: 'workloads' as const, label: 'Workloads' },
    { id: 'pods' as const, label: 'Pods' },
    { id: 'secrets' as const, label: 'Secrets' },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      data-testid="bottom-tab-bar"
      className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe flex"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={`tab-button-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 min-h-[44px] relative ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div data-testid={`tab-icon-${tab.id}`} className="mb-1">
              {tab.id === 'overview' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {tab.id === 'nodes' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              )}
              {tab.id === 'workloads' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
              {tab.id === 'pods' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
              {tab.id === 'secrets' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{tab.label}</span>
            {tab.id === 'pods' && unhealthyPodCount !== undefined && unhealthyPodCount > 0 && (
              <span
                data-testid="pods-badge"
                aria-label={`${unhealthyPodCount} unhealthy pods`}
                className="absolute top-1 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {unhealthyPodCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
