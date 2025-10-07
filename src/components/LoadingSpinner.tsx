export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center">
        <div className="spinner mb-4"></div>
        <p className="text-white text-lg">Loading dashboard...</p>
      </div>
    </div>
  );
}