import { useState, useEffect } from 'react';
import { fetchConfigMaps, ConfigMapInfo } from '../api/configMaps';
import { ConfigMapAccordion } from './ConfigMapAccordion';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { useDataFetch } from '../hooks/useDataFetch';

interface ConfigMapsTabProps {
  namespace?: string;
}

export function ConfigMapsTab({ namespace }: ConfigMapsTabProps = {}) {
  const { data: configMaps, isLoading, error, refresh } = useDataFetch<ConfigMapInfo>(
    () => fetchConfigMaps(namespace),
    'Failed to fetch configmaps',
    [namespace],
  );

  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);

  // Reset accordion when namespace changes
  useEffect(() => {
    setOpenAccordionIndex(null);
  }, [namespace]);

  const handleAccordionToggle = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };

  return (
    <div data-testid="configmaps-tab" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ConfigMaps</h1>

      {isLoading && configMaps.length === 0 && (
        <LoadingSkeleton
          variant="list"
          count={5}
          testId="configmaps-loading"
        />
      )}

      {error && configMaps.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading configmaps"
          testId="configmaps-error"
        />
      )}

      {!isLoading && !error && configMaps.length === 0 && (
        <EmptyState
          message={`No configmaps found${namespace ? ` in namespace "${namespace}"` : ''}`}
          testId="no-configmaps-message"
        />
      )}

      {configMaps.length > 0 && (
        <div className="space-y-3">
          {configMaps.map((configMap, index) => (
            <ConfigMapAccordion
              key={`${configMap.namespace}-${configMap.name}`}
              configMap={configMap}
              isOpen={openAccordionIndex === index}
              onToggle={() => handleAccordionToggle(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
