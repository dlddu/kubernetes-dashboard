import { useState, useEffect } from 'react';
import { fetchConfigMapDetail, ConfigMapInfo, ConfigMapDetail } from '../api/configMaps';
import { ConfigMapKeyValue } from './ConfigMapKeyValue';

interface ConfigMapAccordionProps {
  configMap: ConfigMapInfo;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ConfigMapAccordion({ configMap, isOpen: isOpenProp, onToggle }: ConfigMapAccordionProps) {
  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [configMapDetail, setConfigMapDetail] = useState<ConfigMapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Use prop if provided (controlled), otherwise use internal state (uncontrolled)
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;

  const handleToggle = () => {
    // If controlled component, notify parent
    if (onToggle) {
      onToggle();
    } else {
      // If uncontrolled, manage state internally
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Fetch detail data when opening (only if not already loaded)
  useEffect(() => {
    if (isOpen && !hasLoadedOnce) {
      const loadDetail = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const detail = await fetchConfigMapDetail(configMap.namespace, configMap.name);
          setConfigMapDetail(detail);
          setHasLoadedOnce(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch configmap detail');
        } finally {
          setIsLoading(false);
        }
      };
      loadDetail();
    }
  }, [isOpen, hasLoadedOnce, configMap.namespace, configMap.name]);

  const contentId = `configmap-content-${configMap.name}`;

  return (
    <div data-testid={`configmap-accordion-${configMap.name}`} className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        data-testid="configmap-accordion-header"
        className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        role="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{configMap.name}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="inline-block mr-4">
                <span className="text-gray-500">Namespace: </span>
                <span data-testid="configmap-namespace">{configMap.namespace}</span>
              </span>
              <span className="inline-block">
                <span>{configMap.keys.length}</span>
                <span className="text-gray-500"> keys</span>
              </span>
            </div>
          </div>
          <div className="text-gray-400">
            {isOpen ? '▼' : '▶'}
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          id={contentId}
          data-testid="configmap-details"
          className="px-4 py-3 bg-gray-50 border-t border-gray-200"
          style={{ display: 'block', visibility: 'visible' }}
        >
          {isLoading && (
            <div data-testid="configmap-detail-loading" className="text-center py-4 text-gray-500">
              Loading...
            </div>
          )}

          {error && (
            <div data-testid="configmap-detail-error" className="text-red-600 py-4">
              Error: {error}
            </div>
          )}

          {!isLoading && !error && configMapDetail && (
            <div data-testid="configmap-key-list" className="space-y-2">
              {Object.entries(configMapDetail.data).map(([key, value]) => (
                <ConfigMapKeyValue key={key} configKey={key} value={value} />
              ))}
              {Object.keys(configMapDetail.data).length === 0 && (
                <div className="text-gray-500 text-center py-4">No data in this configmap</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
