import NamespaceSelector from './NamespaceSelector';

export default function TopBar() {
  return (
    <header
      role="banner"
      data-testid="top-bar"
      className="sticky top-0 z-10 bg-white shadow px-4 py-3 flex justify-between items-center sm:px-6 md:px-8"
    >
      <div className="flex items-center gap-3">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23326CE5'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E"
          alt="Kubernetes logo"
          className="w-8 h-8"
        />
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Kubernetes Dashboard
        </h1>
      </div>
      <NamespaceSelector />
    </header>
  );
}
