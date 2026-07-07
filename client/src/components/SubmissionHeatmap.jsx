import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { Flame, Zap, CalendarDays } from 'lucide-react';

const SubmissionHeatmap = ({ data, streak = 0 }) => {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    const stats = useMemo(() => {
        let totalSubmissions = 0;
        let activeDays = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        const sorted = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        sorted.forEach((day, i) => {
            totalSubmissions += day.count;
            if (day.count > 0) activeDays++;
            if (i === 0) {
                currentStreak = 1;
            } else {
                const prev = new Date(sorted[i - 1].date);
                const curr = new Date(day.date);
                const diff = Math.ceil(Math.abs(curr - prev) / 86400000);
                currentStreak = diff === 1 ? currentStreak + 1 : 1;
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        });

        return { totalSubmissions, activeDays, maxStreak };
    }, [data]);

    return (
        <div className="card-bordered font-mono text-xs">
            {/* Header — streak is the primary focus */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-base font-semibold text-zinc-200 font-geist">Submission Activity</h2>
                    <p className="text-[10px] text-zinc-450 uppercase tracking-widest mt-0.5">
                        last 365 days
                    </p>
                </div>

                {/* Stats row — streak center-stage */}
                <div className="flex items-center gap-5">
                    {streak > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-streak/25 bg-streak/5">
                            <Flame size={11} className="text-streak" />
                            <span className="text-streak font-bold text-sm">{streak}</span>
                            <span className="text-[9px] text-zinc-450 uppercase tracking-widest">day streak</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px]">
                        <CalendarDays size={11} className="text-zinc-400" />
                        <span className="text-zinc-300 font-bold">{stats.activeDays}</span>
                        <span className="text-zinc-400 uppercase tracking-widest"> active</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                        <Zap size={11} className="text-zinc-400" />
                        <span className="text-zinc-300 font-bold">{stats.totalSubmissions}</span>
                        <span className="text-zinc-450 uppercase tracking-widest"> total</span>
                    </div>

                    <div className="text-[10px] hidden sm:block">
                        <span className="text-zinc-450 uppercase tracking-widest">best </span>
                        <span className="text-zinc-300 font-bold">{stats.maxStreak}d</span>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="w-full overflow-x-auto pb-1">
                <div className="min-w-[620px]">
                    <CalendarHeatmap
                        startDate={lastYear}
                        endDate={today}
                        values={data}
                        gutterSize={2.5}
                        showWeekdayLabels={true}
                        classForValue={(val) => {
                            if (!val || val.count === 0) return 'color-empty';
                            return `color-scale-${Math.min(val.count, 4)}`;
                        }}
                        tooltipDataAttrs={val => ({
                            'data-tooltip-id': 'heatmap-tip',
                            'data-tooltip-content': val?.date
                                ? `${val.date} — ${val.count} submission${val.count !== 1 ? 's' : ''}`
                                : 'No activity',
                        })}
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest">less</span>
                {['bg-zinc-900', 'bg-[#451a03]', 'bg-[#92400e]', 'bg-[#c2410c]', 'bg-streak'].map((cls, i) => (
                    <span key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
                ))}
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest">more</span>
            </div>

            <Tooltip
                id="heatmap-tip"
                style={{
                    backgroundColor: '#111113', color: '#e4e4e7',
                    border: '1px solid #27272a', borderRadius: '5px',
                    fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
                    padding: '5px 10px',
                }}
            />
        </div>
    );
};

export default SubmissionHeatmap;