import React from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger' }) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            title: 'text-red-400'
        },
        warning: {
            icon: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
            title: 'text-amber-400'
        },
        info: {
            icon: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
            title: 'text-blue-400'
        }
    };

    const style = colors[variant] || colors.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header with Icon */}
                <div className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full ${style.bg} ${style.border} flex items-center justify-center mb-4 border`}>
                        <AlertTriangle className={style.icon} size={24} />
                    </div>

                    <h3 className={`text-lg font-bold mb-2 ${style.title}`}>{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-b-xl border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors border border-slate-700/50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-lg transition-all ${style.button}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
