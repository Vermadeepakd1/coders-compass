import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const PLATFORM_COLORS = {
    cf: '#3b82f6',
    lc: '#f97316',
    cc: '#a78bfa',
};

const ActivityGraph = ({ data = [], platform = 'codeforces', color = '#3b82f6', title, platformKey }) => {
    const resolvedColor = PLATFORM_COLORS[platformKey] || color;

    const formattedData = data.map(item => {
        const dt = new Date(item.date);
        const displayDate = isNaN(dt) ? item.date : `${dt.getMonth() + 1}/${dt.getDate()}`;
        let rawRating = platform === 'rating' ? item.rating : item[platform]?.rating;
        const rating = rawRating != null ? Math.round(rawRating) : null;
        return { ...item, displayDate, rating };
    });

    const validData = formattedData.filter(d => d.rating !== null);
    if (!data.length || !validData.length) return (
        <div className="w-full h-[200px] bg-brand-bg rounded border border-brand-border flex items-center justify-center text-zinc-700 font-mono text-[10px] uppercase tracking-wider">
            No history logged
        </div>
    );

    const lastPoint = validData[validData.length - 1];
    const maxRating = Math.max(...validData.map(d => d.rating));
    const peakPoint = validData.find(d => d.rating === maxRating);
    const firstRating = validData[0]?.rating || 0;
    const delta = lastPoint.rating - firstRating;

    /* Custom dot: only draw at peak and last point */
    const CustomDot = ({ cx, cy, payload }) => {
        const isLast = payload.date === lastPoint.date;
        const isPeak = payload.date === peakPoint.date && peakPoint.date !== lastPoint.date;
        if (isLast) return (
            <g>
                <circle cx={cx} cy={cy} r={4.5} fill={resolvedColor} stroke="#09090b" strokeWidth={1.5} />
                <text x={cx} y={cy - 10} textAnchor="middle" fill={resolvedColor} fontSize={9} fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    {payload.rating}
                </text>
            </g>
        );
        if (isPeak) return (
            <g>
                <circle cx={cx} cy={cy} r={3} fill="#09090b" stroke={resolvedColor} strokeWidth={1.5} strokeDasharray="2 1" />
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#52525b" fontSize={8} fontFamily="JetBrains Mono, monospace">
                    peak {payload.rating}
                </text>
            </g>
        );
        return null;
    };

    return (
        <div className="w-full bg-brand-bg rounded border border-brand-border p-4">
            {/* Chart header */}
            <div className="flex items-center justify-between mb-3 font-mono">
                {title && (
                    <div className="flex items-baseline gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0 self-center" style={{ backgroundColor: resolvedColor }} />
                        <span className="text-[11px] font-semibold text-zinc-350 uppercase tracking-widest">{title}</span>
                        <span className="text-[8px] text-zinc-500 lowercase tracking-normal">
                            (peak: {maxRating} • {delta >= 0 ? '+' : ''}{delta} overall)
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs font-bold font-mono" style={{ color: resolvedColor }}>
                        {lastPoint.rating}
                    </span>
                </div>
            </div>

            <div className="w-full h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData} margin={{ top: 14, right: 8, left: -28, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 0" stroke="#1c1c1e" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fill: '#3f3f46', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                            tickLine={false} axisLine={false} dy={4} minTickGap={40}
                        />
                        <YAxis
                            tick={{ fill: '#3f3f46', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                            tickLine={false} axisLine={false}
                            domain={['dataMin - 80', 'dataMax + 80']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#111113', border: `1px solid #27272a`,
                                borderRadius: '4px', padding: '8px 12px',
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
                            }}
                            itemStyle={{ color: resolvedColor, padding: 0, fontWeight: '700' }}
                            labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px' }}
                            cursor={{ stroke: resolvedColor, strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.3 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="rating"
                            stroke={resolvedColor}
                            strokeWidth={1.5}
                            dot={<CustomDot />}
                            activeDot={{ r: 4, fill: resolvedColor, stroke: '#09090b', strokeWidth: 1.5 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityGraph;
