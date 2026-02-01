import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import SymbolCard from './SymbolCard';

const SymbolGrid = () => {
    const { symbolsState } = useWebSocket();

    if (!symbolsState || Object.keys(symbolsState).length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 animate-pulse">
                Waiting for symbols data...
            </div>
        );
    }

    // Sort: Symbols with positions first, then alphabetical
    const sortedSymbols = Object.keys(symbolsState).sort((a, b) => {
        const posA = symbolsState[a].position ? 1 : 0;
        const posB = symbolsState[b].position ? 1 : 0;
        if (posA !== posB) return posB - posA;
        return a.localeCompare(b);
    });

    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-300 mb-2 pl-1">Live Market</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {sortedSymbols.map(symbol => (
                    <SymbolCard
                        key={symbol}
                        symbol={symbol}
                        data={symbolsState[symbol]}
                    />
                ))}
            </div>
        </div>
    );
};

export default SymbolGrid;
