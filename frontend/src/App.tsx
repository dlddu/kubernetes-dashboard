import { NamespaceProvider } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { SummaryCards } from './components/SummaryCards';
import { UnhealthyPodPreview } from './components/UnhealthyPodPreview';

function App() {
  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <main className="container mx-auto px-4 py-8">
          <div data-testid="overview-tab" className="space-y-6">
            <SummaryCards />
            <UnhealthyPodPreview />
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">
                Welcome to the Kubernetes Dashboard. This is a modern web interface for managing Kubernetes clusters.
              </p>
            </div>
          </div>
        </main>
      </div>
    </NamespaceProvider>
  );
}

export default App;
