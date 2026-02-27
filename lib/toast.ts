// lib/toast.ts
// Beautiful toast notifications

import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            duration: 3000,
            position: 'top-right',
            style: {
                background: '#10B981',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            duration: 4000,
            position: 'top-right',
            style: {
                background: '#EF4444',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
            },
        });
    },

    info: (message: string) => {
        toast(message, {
            duration: 3000,
            position: 'top-right',
            icon: '💡',
            style: {
                background: '#3B82F6',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
            },
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            position: 'top-right',
            style: {
                background: '#6366F1',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
            },
        });
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading,
                success: messages.success,
                error: messages.error,
            },
            {
                position: 'top-right',
                style: {
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                },
            }
        );
    },
};
