export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <p>{message}</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card skeleton-card" style={{ minHeight: 150 }}>
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 32, marginTop: 16 }} />
      <div className="skeleton skeleton-text" style={{ width: '30%', height: 12, marginTop: 8 }} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page">
      <div className="skeleton skeleton-text" style={{ width: 280, height: 32, marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: 200, height: 14, marginBottom: 24 }} />
      <div className="dashboard-stat-row">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="card skeleton-card" style={{ minHeight: 462 }} />
        <div className="card skeleton-card" style={{ minHeight: 462 }} />
      </div>
    </div>
  );
}
