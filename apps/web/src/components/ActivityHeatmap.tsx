interface HeatmapEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

interface Props {
  data: HeatmapEntry[];
  days?: number;
}

function getColorClass(count: number): string {
  if (count === 0) return 'bg-slate-100';
  if (count <= 2) return 'bg-green-200';
  if (count <= 5) return 'bg-green-400';
  return 'bg-green-600';
}

export function ActivityHeatmap({ data, days = 90 }: Props) {
  const countByDate = new Map(data.map((d) => [d.date, d.count]));

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: countByDate.get(key) ?? 0 });
  }

  // Group into weeks (columns of 7 days) for a GitHub-style grid.
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto py-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
              className={`w-3 h-3 rounded-sm ${getColorClass(cell.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}