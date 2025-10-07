export default function MetricCard({ icon, value, label, sublabel, color, onClick }) {
  return (
    <div 
      className={`metric-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <span className="text-4xl mb-2 block">{icon}</span>
      <div className="text-3xl font-bold mb-2" style={{ color: color || '#667eea' }}>
        {value}
      </div>
      <div className="text-gray-600 text-sm uppercase tracking-wider">
        {label}
      </div>
      {sublabel && (
        <div className="text-gray-400 text-xs mt-2">
          {sublabel}
        </div>
      )}
    </div>
  );
}