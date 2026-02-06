import { useState, useEffect } from 'react';
import { checkHealth, HealthResponse } from '../services/api';

export default function HealthCheck() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setStatus('loading');
      setError(null);
      const data = await checkHealth();
      setHealthData(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRetry = () => {
    fetchHealth();
  };

  return (
    <div data-testid="health-check" className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Health Status</h2>

      {status === 'loading' && (
        <p className="text-gray-600">Checking health status...</p>
      )}

      {status === 'success' && healthData && (
        <div className="text-green-600">
          <p>Status: {healthData.status}</p>
          {healthData.timestamp && (
            <p className="text-sm text-gray-500">Last checked: {healthData.timestamp}</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
