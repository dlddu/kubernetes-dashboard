import { FC } from 'react';
import NamespaceSelector from './NamespaceSelector';
import ClusterStatus from './ClusterStatus';

const TopBar: FC = () => {
  return (
    <header
      data-testid="top-bar"
      role="banner"
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Kubernetes Dashboard
            </h1>
            <NamespaceSelector />
          </div>
          <ClusterStatus />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
