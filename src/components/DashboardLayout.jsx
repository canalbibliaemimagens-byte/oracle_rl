import React from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-6 lg:p-8">
            <PWAInstallPrompt />
            <div className="max-w-7xl mx-auto space-y-6">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
