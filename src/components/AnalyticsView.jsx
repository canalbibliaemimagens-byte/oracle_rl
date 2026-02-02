import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, Award, AlertTriangle, Calendar, Clock,
    Activity, DollarSign, Percent, BarChart2, Layers, ArrowUpCircle, ArrowDownCircle,
    Zap, Target, Users
} from 'lucide-react';

const AnalyticsView = () => {
    const { sendCommand, analyticsData } = useWebSocket();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSymbol, setSelectedSymbol] = useState('ALL');
    const [modelSymbol, setModelSymbol] = useState(null); // For Models tab

    // Fetch on mount
    useEffect(() => {
        if (!analyticsData) {
            sendCommand('GET_ANALYTICS', { days: 30 });
        } else {
            setLoading(false);
        }
    }, [analyticsData]);

    const renderContent = () => {
        const data = analyticsData;

        if (loading || !data) {
            return (
                <div className="p-12 text-center text-slate-500 animate-pulse flex flex-col items-center">
                    <Activity className="mb-4 text-blue-500 animate-bounce" size={48} />
                    <div className="text-xl font-medium text-slate-300">Loading Neural Core Analytics...</div>
                    <div className="text-sm opacity-50 mt-2">Processing trade history and performance metrics</div>
                </div>
            );
        }

        if (data.error) {
            return (
                <div className="p-12 text-center text-red-400 border border-red-500/20 rounded-xl bg-red-500/10">
                    <AlertTriangle className="mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold mb-2">Analytics Unavailable</h3>
                    <p className="opacity-80 font-mono">{data.error}</p>
                </div>
            );
        }

        if (data.empty) {
            return (
                <div className="p-12 text-center text-slate-500 border border-slate-700/50 rounded-xl bg-slate-800/20">
                    <Calendar className="mx-auto mb-4 opacity-50" size={48} />
                    <h3 className="text-xl font-bold mb-2">No Trades Recorded</h3>
                    <p>The system hasn't recorded any trades in the last {data.period_days || 30} days.</p>
                </div>
            )
        }

        const {
            summary, highlights, hmm_stats, symbol_stats,
            hourly_stats, weekday_stats, equity_curve, hmm_stats_by_symbol,
            direction_stats, sessions
        } = data;

        // Set default model symbol
        if (!modelSymbol && symbol_stats?.length > 0) {
            setModelSymbol(symbol_stats[0].symbol);
        }

        // Get selected model data
        const getModelData = () => {
            if (!modelSymbol) return null;
            return symbol_stats?.find(s => s.symbol === modelSymbol);
        };

        const getModelHmmData = () => {
            if (!modelSymbol || !hmm_stats_by_symbol) return [];
            return hmm_stats_by_symbol[modelSymbol] || [];
        };

        // Get equity curve filtered by model symbol (calculates running PnL for that symbol)
        const getModelEquityCurve = () => {
            if (!modelSymbol || !equity_curve) return [];
            const filtered = equity_curve.filter(e => e.symbol === modelSymbol);
            // Recalculate running PnL for this symbol only
            let running = 0;
            return filtered.map((item, i) => {
                running += item.trade_pnl;
                return { ...item, pnl: running, idx: i + 1 };
            });
        };

        // Helper to filter HMM stats
        const getHmmData = () => {
            if (selectedSymbol === 'ALL') return hmm_stats;
            return hmm_stats_by_symbol?.[selectedSymbol] || [];
        };

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* KPI Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard
                        label="Net Profit"
                        value={`$${summary.total_pnl}`}
                        subValue={`${summary.total_trades} trades`}
                        icon={<DollarSign size={18} />}
                        color={summary.total_pnl >= 0 ? "text-green-400" : "text-red-400"}
                        bg={summary.total_pnl >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
                    />
                    <KpiCard
                        label="Win Rate"
                        value={`${summary.win_rate}%`}
                        subValue={`PF: ${summary.profit_factor}`}
                        icon={<Percent size={18} />}
                        color={summary.win_rate >= 50 ? "text-blue-400" : "text-amber-400"}
                        bg={summary.win_rate >= 50 ? "bg-blue-500/10" : "bg-amber-500/10"}
                    />
                    <KpiCard
                        label="Expectancy"
                        value={`$${summary.expectancy}`}
                        subValue={`R:R ${summary.risk_reward_ratio}`}
                        icon={<TrendingUp size={18} />}
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                    <KpiCard
                        label="Best Run"
                        value={`${summary.max_consecutive_wins} Wins`}
                        subValue={`Max Loss Streak: ${summary.max_consecutive_losses}`}
                        icon={<Award size={18} />}
                        color="text-amber-400"
                        bg="bg-amber-500/10"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-700/50 pb-1 overflow-x-auto">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={14} />} label="Overview" />
                    <TabButton active={activeTab === 'models'} onClick={() => setActiveTab('models')} icon={<Layers size={14} />} label="Models" />
                    <TabButton active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={<BarChart2 size={14} />} label="Performance" />
                    <TabButton active={activeTab === 'time'} onClick={() => setActiveTab('time')} icon={<Clock size={14} />} label="Time" />
                </div>

                {/* Tab Content */}
                <div className="mt-3">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Equity Curve */}
                            <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-blue-400" /> Capital Growth
                                </h3>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <AreaChart data={equity_curve}>
                                            <defs>
                                                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="timestamp" hide />
                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} domain={['auto', 'auto']} fontSize={11} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                                labelStyle={{ color: '#f1f5f9' }}
                                                itemStyle={{ color: '#60a5fa' }}
                                                formatter={(value) => [`$${value}`, 'Balance']}
                                                labelFormatter={() => ''}
                                            />
                                            <Area type="monotone" dataKey="pnl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPnl)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Drawdown Chart */}
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-400" /> Drawdown
                                </h3>
                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <AreaChart data={(() => {
                                            // Calculate drawdown from equity curve
                                            let peak = 0;
                                            return equity_curve.map((item, i) => {
                                                peak = Math.max(peak, item.pnl);
                                                const dd = peak > 0 ? ((item.pnl - peak) / peak) * 100 : 0;
                                                return { ...item, dd: Math.min(0, dd) };
                                            });
                                        })()}>
                                            <defs>
                                                <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis hide />
                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} domain={['auto', 0]} fontSize={11} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                                labelStyle={{ color: '#f1f5f9' }}
                                                itemStyle={{ color: '#f87171' }}
                                                formatter={(value) => [`${value.toFixed(2)}%`, 'Drawdown']}
                                                labelFormatter={() => ''}
                                            />
                                            <Area type="monotone" dataKey="dd" stroke="#ef4444" fillOpacity={1} fill="url(#colorDD)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* P/L per Trade Chart */}
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-emerald-400" /> P/L per Trade
                                </h3>
                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <BarChart data={equity_curve.map((item, i) => ({ ...item, idx: i + 1 }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="idx" hide />
                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={11} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                                labelStyle={{ color: '#f1f5f9' }}
                                                itemStyle={{ color: '#f1f5f9' }}
                                                formatter={(value) => [`$${value}`, 'Trade P/L']}
                                                labelFormatter={(idx) => `Trade #${idx}`}
                                            />
                                            <Bar dataKey="trade_pnl" radius={[2, 2, 0, 0]}>
                                                {equity_curve.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.trade_pnl >= 0 ? '#4ade80' : '#f87171'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>


                            {/* Direction Stats */}
                            {direction_stats && direction_stats.length > 0 && (
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                                        <Target size={16} className="text-cyan-400" /> Direction Performance
                                    </h3>
                                    <div className="space-y-3">
                                        {direction_stats.map(d => (
                                            <div key={d.direction} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    {d.direction === 'BUY' ?
                                                        <ArrowUpCircle size={20} className="text-green-400" /> :
                                                        <ArrowDownCircle size={20} className="text-red-400" />
                                                    }
                                                    <span className="font-bold text-slate-200">{d.direction}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-slate-400">{d.count} trades</span>
                                                    <span className={`font-bold ${d.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {d.win_rate}% WR
                                                    </span>
                                                    <span className={`font-mono font-bold ${d.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {d.total_pnl >= 0 ? '+' : ''}${d.total_pnl.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sessions Summary */}
                            {sessions && (
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                                        <Users size={16} className="text-purple-400" /> Sessions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-slate-100">{sessions.total_sessions || 0}</div>
                                            <div className="text-xs text-slate-500">Total Sessions</div>
                                        </div>
                                        <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-slate-100">{sessions.avg_trades_per_session || 0}</div>
                                            <div className="text-xs text-slate-500">Avg Trades/Session</div>
                                        </div>
                                        <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-400">+${sessions.best_session_pnl || 0}</div>
                                            <div className="text-xs text-slate-500">Best Session</div>
                                        </div>
                                        <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-red-400">${sessions.worst_session_pnl || 0}</div>
                                            <div className="text-xs text-slate-500">Worst Session</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Symbol Stats */}
                            <StatsTable title="Symbol Performance" data={symbol_stats} rowKey="symbol" labelKey="symbol" />

                            {/* HMM Stats */}
                            <StatsTable title="HMM State Performance" data={hmm_stats} rowKey="state" labelKey="state" labelPrefix="State " />
                        </div>
                    )}

                    {activeTab === 'models' && (
                        <div className="space-y-4">
                            {/* Model Selector */}
                            <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <Layers size={20} className="text-blue-400" />
                                <span className="text-slate-300 font-medium">Select Model:</span>
                                <select
                                    value={modelSymbol || ''}
                                    onChange={(e) => setModelSymbol(e.target.value)}
                                    className="flex-1 max-w-xs bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    {symbol_stats?.map(s => (
                                        <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                                    ))}
                                </select>
                            </div>

                            {modelSymbol && getModelData() && (
                                <>
                                    {/* Model KPIs */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <ModelKpi label="Trades" value={getModelData().count} />
                                        <ModelKpi
                                            label="Win Rate"
                                            value={`${getModelData().win_rate}%`}
                                            color={getModelData().win_rate >= 50 ? 'text-green-400' : 'text-red-400'}
                                        />
                                        <ModelKpi
                                            label="Profit Factor"
                                            value={getModelData().profit_factor}
                                            color={parseFloat(getModelData().profit_factor) >= 1 ? 'text-green-400' : 'text-red-400'}
                                        />
                                        <ModelKpi
                                            label="Total PnL"
                                            value={`$${getModelData().total_pnl}`}
                                            color={getModelData().total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}
                                        />
                                        <ModelKpi label="Avg PnL" value={`$${getModelData().avg_pnl}`} />
                                    </div>

                                    {/* Model Equity Charts Grid */}
                                    {getModelEquityCurve().length > 0 && (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            {/* Capital Growth */}
                                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                                <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                                                    <TrendingUp size={14} className="text-blue-400" /> Capital - {modelSymbol}
                                                </h3>
                                                <div className="h-[160px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                        <AreaChart data={getModelEquityCurve()}>
                                                            <defs>
                                                                <linearGradient id="colorModelPnl" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                            <XAxis hide />
                                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={10} width={45} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                                                                labelStyle={{ color: '#f1f5f9' }}
                                                                itemStyle={{ color: '#60a5fa' }}
                                                                formatter={(value) => [`$${value}`, 'Balance']}
                                                                labelFormatter={() => ''}
                                                            />
                                                            <Area type="monotone" dataKey="pnl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorModelPnl)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Drawdown */}
                                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                                <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                                                    <AlertTriangle size={14} className="text-red-400" /> Drawdown - {modelSymbol}
                                                </h3>
                                                <div className="h-[160px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                        <AreaChart data={(() => {
                                                            let peak = 0;
                                                            return getModelEquityCurve().map((item) => {
                                                                peak = Math.max(peak, item.pnl);
                                                                const dd = peak > 0 ? ((item.pnl - peak) / peak) * 100 : 0;
                                                                return { ...item, dd: Math.min(0, dd) };
                                                            });
                                                        })()}>
                                                            <defs>
                                                                <linearGradient id="colorModelDD" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                            <XAxis hide />
                                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} domain={['auto', 0]} fontSize={10} width={45} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                                                                labelStyle={{ color: '#f1f5f9' }}
                                                                itemStyle={{ color: '#f87171' }}
                                                                formatter={(value) => [`${value.toFixed(2)}%`, 'DD']}
                                                                labelFormatter={() => ''}
                                                            />
                                                            <Area type="monotone" dataKey="dd" stroke="#ef4444" fillOpacity={1} fill="url(#colorModelDD)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* P/L per Trade */}
                                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                                <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                                                    <BarChart2 size={14} className="text-emerald-400" /> P/L per Trade - {modelSymbol}
                                                </h3>
                                                <div className="h-[160px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                        <BarChart data={getModelEquityCurve()}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                            <XAxis dataKey="idx" hide />
                                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={10} width={45} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                                                                labelStyle={{ color: '#f1f5f9' }}
                                                                itemStyle={{ color: '#f1f5f9' }}
                                                                formatter={(value) => [`$${value}`, 'P/L']}
                                                                labelFormatter={(idx) => `Trade #${idx}`}
                                                            />
                                                            <Bar dataKey="trade_pnl" radius={[2, 2, 0, 0]}>
                                                                {getModelEquityCurve().map((entry, index) => (
                                                                    <Cell key={`mcell-${index}`} fill={entry.trade_pnl >= 0 ? '#4ade80' : '#f87171'} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* HMM Performance Chart */}
                                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                                            <Zap size={16} className="text-yellow-400" /> HMM State Performance - {modelSymbol}
                                        </h3>
                                        <div className="h-[220px] w-full">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                <BarChart data={getModelHmmData()} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={11} />
                                                    <YAxis
                                                        dataKey="state"
                                                        type="category"
                                                        stroke="#94a3b8"
                                                        tickFormatter={(val) => `State ${val}`}
                                                        fontSize={11}
                                                        width={60}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                                        labelStyle={{ color: '#f1f5f9' }}
                                                        itemStyle={{ color: '#f1f5f9' }}
                                                        cursor={{ fill: '#1e293b', opacity: 0.5 }}
                                                        formatter={(value, name, props) => [
                                                            `$${value} | ${props.payload.count} trades | ${props.payload.win_rate}% WR`,
                                                            'Performance'
                                                        ]}
                                                    />
                                                    <Bar dataKey="total_pnl" radius={[0, 4, 4, 0]}>
                                                        {getModelHmmData().map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.total_pnl >= 0 ? '#4ade80' : '#f87171'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Model HMM Table */}
                                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
                                        <div className="p-3 border-b border-slate-700/50 bg-slate-800/50">
                                            <h3 className="text-sm font-bold text-slate-100">HMM States Detail - {modelSymbol}</h3>
                                        </div>
                                        <div className="overflow-auto max-h-[250px] custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                                                    <tr>
                                                        <th className="p-2 pl-3">State</th>
                                                        <th className="p-2 text-center">Trades</th>
                                                        <th className="p-2 text-center">Win Rate</th>
                                                        <th className="p-2 text-center">Avg PnL</th>
                                                        <th className="p-2 pr-3 text-right">Total PnL</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs divide-y divide-slate-700/30">
                                                    {getModelHmmData().map((row) => (
                                                        <tr key={row.state} className="hover:bg-slate-700/20 transition-colors">
                                                            <td className="p-2 pl-3 font-bold text-slate-300">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-blue-400">
                                                                    {row.state}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-center text-slate-400">{row.count}</td>
                                                            <td className="p-2 text-center">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.win_rate >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                    {row.win_rate}%
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-center text-slate-400">${row.avg_pnl}</td>
                                                            <td className={`p-2 pr-3 text-right font-mono font-bold ${row.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {row.total_pnl > 0 ? '+' : ''}{row.total_pnl.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <div className="grid grid-cols-1 gap-4">
                            <ChartCard title="Profit by Symbol" data={symbol_stats} xKey="symbol" barKey="total_pnl" />

                            {/* HMM Chart with Selector */}
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-100">Profit by HMM State</h3>
                                    <select
                                        value={selectedSymbol}
                                        onChange={(e) => setSelectedSymbol(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-500"
                                    >
                                        <option value="ALL">Global (All Symbols)</option>
                                        {symbol_stats.map(s => (
                                            <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <BarChart data={getHmmData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis
                                                dataKey="state"
                                                stroke="#94a3b8"
                                                tickFormatter={(val) => `State ${val}`}
                                                fontSize={11}
                                            />
                                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={11} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                                labelStyle={{ color: '#f1f5f9' }}
                                                itemStyle={{ color: '#f1f5f9' }}
                                                cursor={{ fill: '#1e293b', opacity: 0.5 }}
                                                formatter={(value) => [`$${value}`, 'Net Profit']}
                                            />
                                            <Bar dataKey="total_pnl" radius={[4, 4, 0, 0]}>
                                                {getHmmData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.total_pnl >= 0 ? '#4ade80' : '#f87171'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ChartCard title="Hourly Performance" data={hourly_stats} xKey="hour" barKey="total_pnl" xSuffix="h" />
                            <ChartCard title="Weekday Performance" data={weekday_stats} xKey="day_name" barKey="total_pnl" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return renderContent();
};

// --- Sub Components ---

const KpiCard = ({ label, value, subValue, icon, color, bg }) => (
    <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between hover:border-slate-600 transition-colors">
        <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
            <h3 className={`text-lg font-bold mt-0.5 ${color}`}>{value}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{subValue}</p>
        </div>
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
    </div>
);

const ModelKpi = ({ label, value, color = 'text-slate-100' }) => (
    <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl text-center">
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${active
            ? 'bg-slate-800 text-blue-400 border-t border-x border-slate-700 relative -mb-[1px]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
    >
        {icon} {label}
    </button>
);

const StatsTable = ({ title, data, rowKey, labelKey, labelPrefix = '' }) => (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-[300px]">
        <div className="p-3 border-b border-slate-700/50 bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
        </div>
        <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                        <th className="p-2 pl-3">Name</th>
                        <th className="p-2 text-center">WR%</th>
                        <th className="p-2 text-center">Trades</th>
                        <th className="p-2 pr-3 text-right">PnL</th>
                    </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-700/30">
                    {data.map((row) => (
                        <tr key={row[rowKey]} className="hover:bg-slate-700/20 transition-colors group">
                            <td className="p-2 pl-3 font-medium text-slate-300 group-hover:text-white">
                                {labelPrefix}{row[labelKey]}
                            </td>
                            <td className="p-2 text-center">
                                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${row.win_rate >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {row.win_rate}%
                                </span>
                            </td>
                            <td className="p-2 text-center text-slate-500">{row.count}</td>
                            <td className={`p-2 pr-3 text-right font-mono font-bold ${row.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {row.total_pnl > 0 ? '+' : ''}{row.total_pnl.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ChartCard = ({ title, data, xKey, barKey, xPrefix = '', xSuffix = '' }) => (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-100 mb-4">{title}</h3>
        <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey={xKey}
                        stroke="#94a3b8"
                        tickFormatter={(val) => `${xPrefix}${val}${xSuffix}`}
                        fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} fontSize={11} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                        cursor={{ fill: '#1e293b', opacity: 0.5 }}
                        formatter={(value) => [`$${value}`, 'Net Profit']}
                    />
                    <Bar dataKey={barKey} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry[barKey] >= 0 ? '#4ade80' : '#f87171'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export default AnalyticsView;
