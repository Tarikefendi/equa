interface Props {
  points: number;
  compact?: boolean;
}

function getLevel(points: number): { label: string; color: string; emoji: string } {
  if (points >= 500) return { label: 'Uzman', color: 'text-purple-600 bg-purple-50 border-purple-200', emoji: '🏆' };
  if (points >= 200) return { label: 'Deneyimli', color: 'text-blue-600 bg-blue-50 border-blue-200', emoji: '⭐' };
  if (points >= 50)  return { label: 'Aktif', color: 'text-green-600 bg-green-50 border-green-200', emoji: '✅' };
  return { label: 'Yeni', color: 'text-gray-500 bg-gray-50 border-gray-200', emoji: '🌱' };
}

export default function ReputationBadge({ points, compact = false }: Props) {
  const level = getLevel(points);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${level.color}`}>
        {level.emoji} {points} puan
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${level.color}`}>
      <span className="text-lg">{level.emoji}</span>
      <div>
        <p className="text-xs font-semibold leading-none">{level.label}</p>
        <p className="text-xs opacity-75 mt-0.5">{points} puan</p>
      </div>
    </div>
  );
}
