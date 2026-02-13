import { KeyboardEvent } from 'react';

export type TabType = 'overview' | 'pods' | 'nodes' | 'workloads' | 'secrets';

interface BottomTabBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  unhealthyPodCount: number;
}

export function BottomTabBar({ currentTab, onTabChange, unhealthyPodCount }: BottomTabBarProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'pods', label: 'Pods' },
    { id: 'nodes', label: 'Nodes' },
    { id: 'workloads', label: 'Workloads' },
    { id: 'secrets', label: 'Secrets' },
  ];

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttonElements = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-tab-button]')
    );

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % buttonElements.length;
      buttonElements[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + buttonElements.length) % buttonElements.length;
      buttonElements[prevIndex]?.focus();
    }
  };

  return (
    <nav
      data-testid="bottom-tab-bar"
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 md:hidden w-full bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab, index) => {
          const isActive = currentTab === tab.id;
          const showBadge = tab.id === 'pods' && unhealthyPodCount > 0;

          return (
            <button
              key={tab.id}
              data-tab-button
              data-testid={`tab-${tab.id === 'workloads' ? 'deployments' : tab.id}`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 focus:text-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
            >
              <span className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {tab.id === 'overview' && '📊'}
                {tab.id === 'pods' && '🎯'}
                {tab.id === 'nodes' && '🖥️'}
                {tab.id === 'workloads' && '⚙️'}
                {tab.id === 'secrets' && '🔐'}
              </span>
              <span className="mt-1">{tab.label}</span>
              {showBadge && (
                <span
                  data-testid="unhealthy-pod-badge"
                  aria-label={`${unhealthyPodCount} unhealthy pods`}
                  className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-600 rounded-full"
                >
                  {unhealthyPodCount > 99 ? '99+' : unhealthyPodCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
