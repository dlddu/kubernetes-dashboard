import { useState } from 'react';
import { fetchSecretDetail, SecretInfo, SecretDetail } from '../api/secrets';
import { SecretKeyValue } from './SecretKeyValue';

interface SecretAccordionProps {
  secret: SecretInfo;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SecretAccordion({ secret, isOpen = false, onToggle }: SecretAccordionProps) {
  const [secretDetail, setSecretDetail] = useState<SecretDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const handleToggle = async () => {
    const willBeOpen = !isOpen;

    if (onToggle) {
      onToggle();
    }

    // Fetch detail data when opening (only if not already loaded)
    if (willBeOpen && !hasLoadedOnce) {
      try {
        setIsLoading(true);
        setError(null);
        const detail = await fetchSecretDetail(secret.namespace, secret.name);
        setSecretDetail(detail);
        setHasLoadedOnce(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch secret detail');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div data-testid="secret-item" className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        role="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{secret.name}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="inline-block mr-4">Namespace: {secret.namespace}</span>
              <span className="inline-block mr-4">Type: {secret.type}</span>
              <span className="inline-block">{secret.keys.length} keys</span>
            </div>
          </div>
          <div className="text-gray-400">
            {isOpen ? '▼' : '▶'}
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          data-testid="secret-details"
          className="px-4 py-3 bg-gray-50 border-t border-gray-200"
          style={{ display: 'block', visibility: 'visible' }}
        >
          {isLoading && (
            <div data-testid="secret-detail-loading" className="text-center py-4 text-gray-500">
              Loading...
            </div>
          )}

          {error && (
            <div data-testid="secret-detail-error" className="text-red-600 py-4">
              Error: {error}
            </div>
          )}

          {!isLoading && !error && secretDetail && (
            <div className="space-y-2">
              {Object.entries(secretDetail.data).map(([key, value]) => (
                <SecretKeyValue key={key} secretKey={key} value={value} />
              ))}
              {Object.keys(secretDetail.data).length === 0 && (
                <div className="text-gray-500 text-center py-4">No data in this secret</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
