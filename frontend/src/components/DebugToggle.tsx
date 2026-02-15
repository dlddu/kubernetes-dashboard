import { Bug } from 'lucide-react';
import { useDebugContext } from '../contexts/DebugContext';

export function DebugToggle() {
  const { isDebugMode, toggleDebugMode } = useDebugContext();

  return (
    <button
      data-testid="debug-toggle"
      onClick={toggleDebugMode}
      aria-pressed={isDebugMode ? 'true' : 'false'}
      aria-label={`Debug mode ${isDebugMode ? 'enabled' : 'disabled'}`}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
        isDebugMode
          ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      }`}
    >
      <Bug className="w-4 h-4" />
      Debug {isDebugMode ? 'ON' : 'OFF'}
    </button>
  );
}
