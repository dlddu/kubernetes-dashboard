import { useLocation, useNavigate } from 'react-router-dom';

interface BottomTabBarProps {
  unhealthyPodCount: number;
  onTabChange?: (path: string) => void;
}

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: JSX.Element;
}

export function BottomTabBar({ unhealthyPodCount, onTabChange }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'nodes',
      label: 'Nodes',
      path: '/nodes',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      id: 'workloads',
      label: 'Workloads',
      path: '/workloads',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'pods',
      label: 'Pods',
      path: '/pods',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'secrets',
      label: 'Secrets',
      path: '/secrets',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const isTabActive = (tabPath: string): boolean => {
    const pathname = location.pathname;

    if (tabPath === '/') {
      return pathname === '/';
    }

    // Handle trailing slash
    const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    // Support nested routes (e.g., /pods/detail/123)
    return normalizedPath === tabPath || normalizedPath.startsWith(tabPath + '/');
  };

  const handleTabClick = (path: string) => {
    navigate(path);
    if (onTabChange) {
      onTabChange(path);
    }
  };

  const shouldShowBadge = unhealthyPodCount && unhealthyPodCount > 0;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      data-testid="bottom-tab-bar"
      className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.path);

          return (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => handleTabClick(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center
                min-h-[56px] flex-1 relative
                transition-colors duration-200
                ${isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'pods' && shouldShowBadge && (
                  <span
                    data-testid="pods-badge"
                    aria-label={`${unhealthyPodCount} unhealthy pods`}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  >
                    {unhealthyPodCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
