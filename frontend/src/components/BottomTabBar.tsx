import { useEffect, useState, useRef } from 'react';

interface BottomTabBarProps {
  unhealthyPodCount?: number;
}

interface Tab {
  name: string;
  path: string;
  icon: JSX.Element;
  label: string;
  ariaLabel: string;
}

export function BottomTabBar({ unhealthyPodCount }: BottomTabBarProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.location.assign(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number, path: string) => {
    const tabCount = tabs.length;
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (index + 1) % tabCount;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (index - 1 + tabCount) % tabCount;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabCount - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        navigate(path);
        return;
    }

    if (newIndex !== null && tabRefs.current[newIndex]) {
      tabRefs.current[newIndex]?.focus();
    }
  };

  const tabs: Tab[] = [
    {
      name: 'overview',
      path: '/',
      label: 'Overview',
      ariaLabel: 'Navigate to Overview',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'pods',
      path: '/pods',
      label: 'Pods',
      ariaLabel: unhealthyPodCount && unhealthyPodCount > 0 ? `Navigate to Pods (${unhealthyPodCount} unhealthy)` : 'Navigate to Pods',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'nodes',
      path: '/nodes',
      label: 'Nodes',
      ariaLabel: 'Navigate to Nodes',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      name: 'deployments',
      path: '/workloads',
      label: 'Deployments',
      ariaLabel: 'Navigate to Deployments',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      name: 'secrets',
      path: '/secrets',
      label: 'Secrets',
      ariaLabel: 'Navigate to Secrets',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    return currentPath === path;
  };

  const displayBadgeCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  const shouldShowBadge = (count?: number) => {
    return count !== undefined && count > 0;
  };

  return (
    <nav
      data-testid="bottom-tab-bar"
      role="navigation"
      aria-label="Main navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 shadow-lg pb-safe z-50"
    >
      <div className="flex justify-around items-center">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            ref={(el) => (tabRefs.current[index] = el)}
            data-testid={`tab-${tab.name}`}
            role="link"
            onClick={() => navigate(tab.path)}
            onKeyDown={(e) => handleKeyDown(e, index, tab.path)}
            aria-label={tab.ariaLabel}
            aria-current={isActive(tab.path) ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-3 text-xs transition-colors ${
              isActive(tab.path)
                ? 'text-blue-600 font-semibold active'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.name === 'pods' && shouldShowBadge(unhealthyPodCount) && (
                <span
                  data-testid="unhealthy-pod-badge"
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                >
                  {displayBadgeCount(unhealthyPodCount!)}
                </span>
              )}
            </div>
            <span className="mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
