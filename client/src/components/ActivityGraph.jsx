import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ActivityGraph = ({ data = [], platform = 'codeforces', color = '#4ecdc4', title }) => {
    const formattedData = data.map(item => {
        const dt = new Date(item.date);
        const displayDate = isNaN(dt) ? item.date : `${dt.getMonth() + 1}/${dt.getDate()}`;

        // If platform is 'rating', assume item.rating is the value directly (new API format)
        // Otherwise, access nested property (old DailyStat format)
        let rawRating;
        if (platform === 'rating') {
            rawRating = item.rating;
        } else {
            rawRating = item[platform]?.rating;
        }

        const rating = rawRating != null ? Math.round(rawRating) : null;
        return { ...item, displayDate, rating };
    });

    // Filter out null ratings to find peak and last
    const validData = formattedData.filter(d => d.rating !== null);

    if (!data || data.length === 0 || validData.length === 0) {
        return (
            <div className="w-full h-[250px] bg-[#1a2629] p-4 rounded-xl border border-[#374151] flex items-center justify-center text-gray-500 text-sm">
                No rating history available
            </div>
        );
    }

    const lastPoint = validData[validData.length - 1];
    const maxRating = Math.max(...validData.map(d => d.rating));
    const peakPoint = validData.find(d => d.rating === maxRating);

    // Custom Dot to show labels on Peak and Last points
    const CustomizedDot = (props) => {
        const { cx, cy, payload } = props;

        const isLast = payload.date === lastPoint.date;
        const isPeak = payload.date === peakPoint.date;

        if (isLast || isPeak) {
            return (
                <g>
                    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
                    <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                        fontWeight="bold"
                        style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                        {payload.rating}
                    </text>
                </g>
            );
        }

        return (
            <circle cx={cx} cy={cy} r={3} fill="#111f22" stroke={color} strokeWidth={2} />
        );
    };

    return (
        <div className="w-full h-[250px] bg-[#1a2629] p-4 rounded-xl border border-[#374151]">
            {title && <h3 className="text-white font-semibold mb-4">{title}</h3>}
            <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#9CA3AF"
                            tick={{ fill: '#6B7280', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            tick={{ fill: '#6B7280', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            domain={['dataMin - 50', 'dataMax + 50']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#111f22',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: color, fontSize: '12px' }}
                            labelStyle={{ color: '#9CA3AF', marginBottom: '0.25rem', fontSize: '12px' }}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="rating"
                            stroke={color}
                            strokeWidth={2}
                            dot={<CustomizedDot />}
                            activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default ActivityGraph
