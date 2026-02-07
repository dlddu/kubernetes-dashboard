import { NamespaceSelector } from './NamespaceSelector';
import { ClusterStatus } from './ClusterStatus';

export function TopBar() {
  return (
    <header
      role="banner"
      data-testid="top-bar"
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              Kubernetes Dashboard
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <NamespaceSelector />
            <ClusterStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
