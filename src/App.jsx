import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import DashboardLayout from './components/DashboardLayout';
import MetricsHeader from './components/MetricsHeader';
import ControlPanel from './components/ControlPanel';
import SymbolGrid from './components/SymbolGrid';
import PerformanceChart from './components/PerformanceChart';
import LogViewer from './components/LogViewer';
import AnalyticsView from './components/AnalyticsView';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import PWAUpdatePrompt, { forceAppRefresh } from './components/PWAUpdatePrompt';
import { LayoutDashboard, BarChart3, LogOut, RefreshCw } from 'lucide-react';

// Main dashboard content (separated for auth check)
function DashboardContent() {
  const { logout, requiresAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <WebSocketProvider>
      <DashboardLayout>
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img src="/pwa-icon.png" alt="App Icon" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Oracle Trader
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider">AI POWERED TRADING SYSTEM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold ${activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold ${activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
              >
                <BarChart3 size={16} /> Analytics
              </button>
            </div>

            {/* Logout button (only in auth mode) */}
            {requiresAuth && (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            )}

            {/* Force Refresh Button */}
            <button
              onClick={forceAppRefresh}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800/50 transition-all"
              title="Force Refresh (Clear Cache)"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Global Metrics (Visible on both tabs) */}
        <MetricsHeader />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'dashboard' ? (
            <>
              {/* Control & Monitors */}
              <div className="mb-6">
                <ControlPanel />
              </div>

              {/* Main Grid: Charts & Symbols */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <SymbolGrid />
                </div>
                <div className="space-y-6">
                  <PerformanceChart />
                  <LogViewer />
                </div>
              </div>
            </>
          ) : (
            <AnalyticsView />
          )}
        </div>

        {/* PWA Update Prompt */}
        <PWAUpdatePrompt />

      </DashboardLayout>
    </WebSocketProvider>
  );
}

// App wrapper with auth
function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

// Auth gate component
function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardContent />;
}

export default App;
