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
            iconTheme: { primary: '#fff', secondary: '#10B981' },
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
            iconTheme: { primary: '#fff', secondary: '#EF4444' },
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
        messages: { loading: string; success: string; error: string }
    ) => {
        return toast.promise(
            promise,
            { loading: messages.loading, success: messages.success, error: messages.error },
            {
                position: 'top-right',
                style: { padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' },
            }
        );
    },

    /**
     * Destructive confirm toast — shows message with Cancel / Delete buttons.
     * Replaces window.confirm() for destructive actions.
     *
     * @example showToast.confirm('Delete this goal?', () => onDeleteGoal(id));
     */
    confirm: (message: string, onConfirm: () => void, confirmLabel = 'Delete') => {
        // We need to return a toast ID so callers can dismiss if needed
        const toastId = toast.custom(
            (t) => (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        minWidth: 240,
                        maxWidth: 300,
                        background: '#1a1a1a',
                        border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        opacity: t.visible ? 1 : 0,
                        transition: 'opacity 0.2s',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                            {message}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => toast.dismiss(toastId)}
                            style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { toast.dismiss(toastId); onConfirm(); }}
                            style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity, position: 'top-right' }
        );
        return toastId;
    },
};
