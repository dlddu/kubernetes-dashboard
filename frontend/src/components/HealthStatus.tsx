import { useEffect, useState } from 'react';
import { fetchHealth, type HealthResponse } from '../api/health';

function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const data = await fetchHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health status');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();

    // Poll health status every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center space-x-2" data-testid="health-status">
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-600">Checking...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2" data-testid="health-status">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <span className="text-sm text-red-600">Error: {error}</span>
      </div>
    );
  }

  if (health && health.status === 'ok') {
    return (
      <div className="flex items-center space-x-2" data-testid="health-status">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <span className="text-sm text-green-600">Healthy</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2" data-testid="health-status">
      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
      <span className="text-sm text-yellow-600">Unknown status</span>
    </div>
  );
}

export default HealthStatus;
