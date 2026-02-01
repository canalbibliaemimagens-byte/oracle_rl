import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useWebSocket } from '../context/WebSocketContext';

const PerformanceChart = () => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const { systemState } = useWebSocket();
    const [data, setData] = useState([]);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8', // slate-400
                fontSize: 10, // Optimized for small height
                fontFamily: 'Inter, sans-serif',
            },
            rightPriceScale: {
                scaleMargins: {
                    top: 0.2,
                    bottom: 0.2,
                },
                borderVisible: false,
            },
            grid: {
                vertLines: { color: '#1e293b' }, // slate-800
                horzLines: { color: '#1e293b' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 160,
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
                borderVisible: false,
            },
        });

        const series = chart.addAreaSeries({
            lineColor: '#3b82f6', // blue-500
            topColor: 'rgba(59, 130, 246, 0.4)',
            bottomColor: 'rgba(59, 130, 246, 0.0)',
            lineWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update Data
    useEffect(() => {
        if (systemState && seriesRef.current) {
            const now = Math.floor(Date.now() / 1000);
            const val = systemState.equity;

            // Add point (simple de-dupe on time)
            setData(prev => {
                const last = prev[prev.length - 1];
                if (last && last.time === now) return prev;

                const next = [...prev, { time: now, value: val }];
                // Keep last 1000 points
                if (next.length > 1000) return next.slice(-1000);
                return next;
            });

            seriesRef.current.update({ time: now, value: val });
        }
    }, [systemState?.equity]); // Only update when equity changes

    return (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 px-1">Performance (Equity)</h3>
            <div ref={chartContainerRef} className="w-full h-[160px]" />
        </div>
    );
};

export default PerformanceChart;
