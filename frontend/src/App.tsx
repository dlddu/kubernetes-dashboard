import { NamespaceProvider } from './contexts/NamespaceContext';
import { TopBar } from './components/TopBar';
import { OverviewTab } from './components/OverviewTab';

function App() {
  return (
    <NamespaceProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <main className="container mx-auto px-4 py-8">
          <OverviewTab />
        </main>
      </div>
    </NamespaceProvider>
  );
}

export default App;
