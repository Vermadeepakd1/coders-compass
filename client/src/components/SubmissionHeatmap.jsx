import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';

const SubmissionHeatmap = ({ data }) => {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    // Calculate stats
    const stats = useMemo(() => {
        let totalSubmissions = 0;
        let activeDays = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        // Sort data to ensure chronological order
        const sortedData = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedData.forEach((day, index) => {
            totalSubmissions += day.count;
            if (day.count > 0) activeDays++;

            if (index === 0) {
                currentStreak = 1;
            } else {
                const prevDate = new Date(sortedData[index - 1].date);
                const currDate = new Date(day.date);
                const diffTime = Math.abs(currDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        });

        return { totalSubmissions, activeDays, maxStreak };
    }, [data]);

    return (
        <div className="bg-[#111f22] p-6 rounded-xl shadow-lg border border-gray-800 mt-6">
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div className="text-white mb-4 md:mb-0">
                    <span className="text-xl font-bold">{stats.totalSubmissions}</span>
                    <span className="text-gray-400 ml-2">submissions in the past one year</span>
                </div>

                <div className="flex gap-6 text-sm text-gray-400">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">Total active days</span>
                        <span className="font-semibold text-white">{stats.activeDays}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">Max streak</span>
                        <span className="font-semibold text-white">{stats.maxStreak}</span>
                    </div>
                </div>
            </div>

            <CalendarHeatmap
                startDate={lastYear}
                endDate={today}
                values={data}
                gutterSize={4}
                showWeekdayLabels={true}
                classForValue={(val) => {
                    if (!val) return 'color-empty';
                    return `color-scale-${Math.min(val.count, 4)}`; // Scale 1-4
                }}
                tooltipDataAttrs={val => ({
                    'data-tooltip-id': 'heatmap-tooltip',
                    'data-tooltip-content': val.date ? `${val.date}: ${val.count} submissions` : 'No Data',
                })}
            />
            <Tooltip
                id="heatmap-tooltip"
                style={{
                    backgroundColor: '#0c1618',
                    color: '#4ecdc4',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px',
                }}
            />
        </div>
    );
};
export default SubmissionHeatmap;