import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Activity, TrendingUp, TrendingDown, DollarSign, ShieldAlert } from 'lucide-react';

const MetricCard = ({ label, value, subValue, icon: Icon, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    return (
        <div className={`flex items-start p-3 rounded-xl border backdrop-blur-sm ${colorClasses[color]} transition-all duration-300`}>
            <div className="p-2 rounded-lg bg-slate-900/50 mr-3">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs font-medium opacity-70 mb-0.5 uppercase tracking-wider">{label}</p>
                <h3 className="text-xl lg:text-2xl font-bold tracking-tight">{value}</h3>
                {subValue && <p className="text-[10px] lg:text-xs opacity-60 mt-0.5">{subValue}</p>}
            </div>
        </div>
    );
};

const MetricsHeader = () => {
    const { systemState, isConnected } = useWebSocket();

    // Loading State
    if (!systemState) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl"></div>)}
            </div>
        );
    }

    // Safe variables with defaults
    const balance = systemState.balance ?? 0;
    const equity = systemState.equity ?? 0;
    const current_dd = systemState.dd_pct ?? 0;
    const max_dd_pct = systemState.max_dd_pct ?? 0;
    const total_pnl = systemState.pnl ?? 0;
    const status = systemState.status || "UNKNOWN";

    const safeFixed = (val) => (typeof val === 'number' ? val.toFixed(2) : "0.00");
    const isPositive = total_pnl >= 0;

    // Calculate Floating PnL
    const floating_pnl = equity - balance;
    const isFloatingPositive = floating_pnl >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
            <MetricCard
                label="Equity"
                value={`$${safeFixed(equity)}`}
                subValue={
                    <span className="flex items-center gap-2">
                        <span>Bal: ${safeFixed(balance)}</span>
                        <span className={`font-bold ${isFloatingPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            ({isFloatingPositive ? "+" : ""}{safeFixed(floating_pnl)})
                        </span>
                    </span>
                }
                icon={DollarSign}
                color="blue"
            />

            <MetricCard
                label="Total PnL"
                value={`$${safeFixed(Math.abs(total_pnl))}`}
                subValue={isPositive ? "Profit" : "Loss"}
                icon={isPositive ? TrendingUp : TrendingDown}
                color={isPositive ? "green" : "red"}
            />

            <MetricCard
                label="Floating PnL / DD"
                value={`${current_dd >= 0 ? '+' : ''}${safeFixed(current_dd)}%`}
                subValue={`Max DD: ${safeFixed(max_dd_pct)}%`}
                icon={current_dd >= 0 ? TrendingUp : TrendingDown}
                color={current_dd >= 0 ? "green" : "red"}
            />

            <MetricCard
                label="System Status"
                value={isConnected ? status : "DISCONNECTED"}
                subValue={isConnected ? "Online" : "Reconnecting..."}
                icon={isConnected ? Activity : ShieldAlert}
                color={isConnected && status === 'RUNNING' ? "green" : "red"}
            />
        </div>
    );
};

export default MetricsHeader;
