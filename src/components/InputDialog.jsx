import React, { useState, useEffect } from 'react';
import { X, Check, Keyboard } from 'lucide-react';

const InputDialog = ({ isOpen, onClose, onSubmit, title, message, placeholder = '', icon: Icon = Keyboard }) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) setValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                        <Icon size={18} className="text-blue-400" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-slate-400 mb-4">{message}</p>

                    <input
                        autoFocus
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <Check size={16} /> Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InputDialog;
