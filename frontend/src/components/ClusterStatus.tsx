export function ClusterStatus() {
  return (
    <div data-testid="cluster-status" className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-700">Cluster Connected</span>
      </div>
    </div>
  );
}
