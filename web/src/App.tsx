import HealthCheck from './components/HealthCheck';

function App() {
  return (
    <div data-testid="app" className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Kubernetes Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your Kubernetes clusters
          </p>
        </header>

        <main>
          <HealthCheck />
        </main>
      </div>
    </div>
  );
}

export default App;
