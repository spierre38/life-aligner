'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
    id: string;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${Date.now()}`;
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            hideToast(id);
        }, 3000);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
    const typeStyles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-orange-500 text-white',
        info: 'bg-indigo-500 text-white'
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    return (
        <div
            className={`
                ${typeStyles[toast.type]}
                px-4 py-3 rounded-lg shadow-lg
                flex items-center gap-3
                animate-slide-in-right
                min-w-[300px] max-w-md
            `}
        >
            <span className="text-lg font-bold">{icons[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="text-white/80 hover:text-white transition"
            >
                ✕
            </button>
        </div>
    );
}
