import React, { useState } from 'react';

const NewClientsChart: React.FC<{ data: { name: string; count: number }[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const hasData = data.some(d => d.count > 0);

    if (!hasData) {
        return (
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg h-full border border-brand-border">
                <h3 className="font-bold text-lg text-gradient mb-6">Akuisisi Pengantin Baru ({new Date().getFullYear()})</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-brand-bg border-2 border-dashed border-brand-border flex items-center justify-center mb-3">
                        <svg className="w-10 h-10 text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-brand-text-light mb-1">Belum Ada Pengantin Baru</p>
                    <p className="text-xs text-brand-text-secondary">Data pengantin baru akan muncul di sini</p>
                </div>
            </div>
        );
    }

    // Generate gradient colors for each bar
    const getBarColor = (index: number) => {
        const colors = [
            { from: 'from-blue-600', to: 'to-cyan-400', solid: 'bg-blue-600', glow: 'shadow-blue-600/50' },
            { from: 'from-purple-500', to: 'to-pink-400', solid: 'bg-purple-600', glow: 'shadow-purple-500/50' },
            { from: 'from-green-500', to: 'to-emerald-400', solid: 'bg-green-600', glow: 'shadow-green-500/50' },
            { from: 'from-orange-500', to: 'to-amber-400', solid: 'bg-orange-600', glow: 'shadow-orange-500/50' },
            { from: 'from-pink-500', to: 'to-rose-400', solid: 'bg-pink-500', glow: 'shadow-pink-500/50' },
            { from: 'from-indigo-500', to: 'to-blue-800', solid: 'bg-indigo-600', glow: 'shadow-indigo-500/50' },
            { from: 'from-teal-500', to: 'to-cyan-400', solid: 'bg-teal-500', glow: 'shadow-teal-500/50' },
            { from: 'from-red-500', to: 'to-orange-400', solid: 'bg-red-600', glow: 'shadow-red-500/50' },
            { from: 'from-violet-500', to: 'to-purple-400', solid: 'bg-violet-500', glow: 'shadow-violet-500/50' },
            { from: 'from-cyan-500', to: 'to-blue-800', solid: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
            { from: 'from-amber-500', to: 'to-yellow-400', solid: 'bg-amber-500', glow: 'shadow-amber-500/50' },
            { from: 'from-emerald-500', to: 'to-green-400', solid: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg h-full border border-brand-border">
            <h3 className="font-bold text-lg text-gradient mb-2">Akuisisi Pengantin Baru ({new Date().getFullYear()})</h3>
            <p className="text-xs text-brand-text-secondary mb-6">Jumlah pengantin baru per bulan</p>
            <div className="h-52 flex justify-between items-end gap-2 relative bg-gradient-to-t from-brand-bg/50 to-transparent rounded-xl p-4">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="border-t border-brand-border/20"></div>
                    ))}
                </div>

                {data.map((item, index) => {
                    const height = Math.max((item.count / maxCount) * 100, 5);
                    const isHovered = hoveredIndex === index;
                    const barColor = getBarColor(index);

                    return (
                        <div
                            key={item.name}
                            className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer z-10"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Tooltip */}
                            {isHovered && (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gradient-to-br from-brand-surface to-brand-bg border-2 border-brand-accent/40 text-white font-semibold py-2.5 px-4 rounded-xl shadow-2xl text-xs whitespace-nowrap z-20 backdrop-blur-sm">
                                    <p className="text-brand-accent font-bold mb-1">{item.name}</p>
                                    <p className="text-brand-text-light flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-bold text-lg">{item.count}</span>
                                        <span>Pengantin</span>
                                    </p>
                                </div>
                            )}

                            {/* Count label on top of bar */}
                            {item.count > 0 && (
                                <div className={`absolute -top-6 text-xs font-bold py-1 px-2 rounded-md transition-all duration-300 ${isHovered
                                    ? 'opacity-100 scale-110 text-brand-accent'
                                    : 'opacity-70 text-brand-text-secondary'
                                    }`}>
                                    {item.count}
                                </div>
                            )}

                            {/* Bar with gradient */}
                            <div
                                className={`w-full rounded-t-xl transition-all duration-300 bg-gradient-to-t ${barColor.from} ${barColor.to} relative overflow-hidden ${isHovered
                                    ? `shadow-2xl ${barColor.glow} scale-x-110 scale-y-105`
                                    : 'shadow-lg hover:scale-105'
                                    }`}
                                style={{ height: `${height}%` }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Animated pulse when hovered */}
                                {isHovered && (
                                    <div className="absolute inset-0 animate-pulse bg-white/10"></div>
                                )}
                            </div>

                            {/* Month label */}
                            <span className={`text-[10px] mt-2.5 font-medium transition-all duration-300 ${isHovered
                                ? 'text-brand-accent font-bold scale-110'
                                : 'text-brand-text-secondary'
                                }`}>
                                {item.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Summary info */}
            <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-brand-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Total: <span className="font-bold text-brand-text-light">{data.reduce((sum, d) => sum + d.count, 0)} Pengantin</span></span>
                </div>
                <div className="text-brand-text-secondary">
                    Rata-rata: <span className="font-bold text-brand-text-light">{(data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)} / bulan</span>
                </div>
            </div>
        </div>
    );
};


export default NewClientsChart;
