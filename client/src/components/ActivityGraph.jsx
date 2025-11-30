import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ActivityGraph = ({ data = [] }) => {
    const formattedData = data.map(item => {
        const dt = new Date(item.date);
        const displayDate = isNaN(dt) ? item.date : `${dt.getMonth() + 1}/${dt.getDate()}`;
        // Safely access rating, default to null if missing
        const rating = item.codeforces?.rating || null;
        return { ...item, displayDate, rating };
    });

    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-8">No history available yet</div>;
    }

    return (
        <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        stroke="#9CA3AF"
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
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
                        itemStyle={{ color: '#4ecdc4', fontSize: '12px' }}
                        labelStyle={{ color: '#9CA3AF', marginBottom: '0.25rem', fontSize: '12px' }}
                        cursor={{ stroke: '#4ecdc4', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#4ecdc4"
                        strokeWidth={2}
                        dot={{ fill: '#111f22', stroke: '#4ecdc4', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#4ecdc4', stroke: '#fff', strokeWidth: 2 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default ActivityGraph
