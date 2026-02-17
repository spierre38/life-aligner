'use client';

// app/dashboard/admin/users/page.tsx
// User management - search, view, deactivate users

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
    id: string;
    full_name: string | null;
    role: string;
    subscription_status: string;
    workbook_completed: boolean;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

type FilterStatus = 'all' | 'free' | 'paid' | 'lifetime' | 'completed' | 'inactive';
type SortField = 'created_at' | 'full_name' | 'subscription_status';
type SortDirection = 'asc' | 'desc';

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
    user,
    onDeactivate,
    onReactivate,
    onViewDetails,
}: {
    user: User;
    onDeactivate: (id: string) => void;
    onReactivate: (id: string) => void;
    onViewDetails: (user: User) => void;
}) {
    const [confirming, setConfirming] = useState(false);

    const handleDeactivate = () => {
        if (!confirming) {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000); // Reset after 3s
            return;
        }
        onDeactivate(user.id);
        setConfirming(false);
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition group">
            <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.is_active
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                        }`}>
                        {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${user.is_active ? 'text-white' : 'text-gray-500'}`}>
                            {user.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.subscription_status === 'paid'
                    ? 'bg-green-500/20 text-green-400'
                    : user.subscription_status === 'lifetime'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                    {user.subscription_status}
                </span>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    {user.workbook_completed ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            In Progress
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.is_active
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                    }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-4 py-4 text-xs text-gray-500">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                        onClick={() => onViewDetails(user)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                        title="View details"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    {user.is_active ? (
                        <button
                            onClick={handleDeactivate}
                            className={`p-1.5 rounded-lg transition ${confirming
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                            title={confirming ? 'Click again to confirm' : 'Deactivate user'}
                        >
                            {confirming ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => onReactivate(user.id)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                            title="Reactivate user"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
    const [workbookEntries, setWorkbookEntries] = useState<{ category: string; updated_at: string }[]>([]);

    useEffect(() => {
        const fetchEntries = async () => {
            const { data } = await supabase
                .from('workbook_entries')
                .select('category, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            setWorkbookEntries(data || []);
        };
        fetchEntries();
    }, [user.id, supabase]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {(user.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">{user.full_name || 'Unknown User'}</h2>
                            <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Role', value: user.role },
                            { label: 'Status', value: user.is_active ? 'Active' : 'Inactive' },
                            { label: 'Subscription', value: user.subscription_status },
                            { label: 'Joined', value: new Date(user.created_at).toLocaleDateString() },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-800/50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 mb-1">{label}</p>
                                <p className="text-sm text-white font-medium capitalize">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Workbook Progress */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Workbook Progress</h3>
                        <div className="space-y-2">
                            {['values', 'interests', 'life_categories', 'roadmap'].map((category) => {
                                const entry = workbookEntries.find(e => e.category === category);
                                return (
                                    <div key={category} className="flex items-center justify-between py-2 border-b border-gray-800">
                                        <span className="text-sm text-gray-400 capitalize">
                                            {category.replace('_', ' ')}
                                        </span>
                                        {entry ? (
                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {new Date(entry.updated_at).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-600">Not started</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl transition text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [sort, setSort] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .order(sort, { ascending: sortDir === 'asc' });

            // Apply filters
            if (filter === 'free') query = query.eq('subscription_status', 'free');
            if (filter === 'paid') query = query.eq('subscription_status', 'paid');
            if (filter === 'lifetime') query = query.eq('subscription_status', 'lifetime');
            if (filter === 'completed') query = query.eq('workbook_completed', true);
            if (filter === 'inactive') query = query.eq('is_active', false);

            // Apply search (by name)
            if (search.trim()) {
                query = query.ilike('full_name', `%${search.trim()}%`);
            }

            const { data, error: queryError, count } = await query;

            if (queryError) throw queryError;

            // Add is_active field (use subscription_status as proxy if not in schema yet)
            const usersWithActive = (data || []).map(u => ({
                ...u,
                is_active: u.is_active !== false, // Default to active if field doesn't exist
            }));

            setUsers(usersWithActive);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [supabase, sort, sortDir, filter, search]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, search ? 300 : 0);

        return () => clearTimeout(debounce);
    }, [fetchUsers, search]);

    const handleDeactivate = async (userId: string) => {
        try {
            // Soft delete - update role to 'inactive' 
            // Note: You may need to add an 'is_active' column to profiles
            // For now we use a subscription_status update as proxy
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'inactive' })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_active: false, role: 'inactive' } : u
            ));
        } catch (err) {
            console.error('Error deactivating user:', err);
            alert('Failed to deactivate user. Please try again.');
        }
    };

    const handleReactivate = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'user' })
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_active: true, role: 'user' } : u
            ));
        } catch (err) {
            console.error('Error reactivating user:', err);
            alert('Failed to reactivate user. Please try again.');
        }
    };

    const toggleSort = (field: SortField) => {
        if (sort === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(field);
            setSortDir('desc');
        }
    };

    const FILTERS: { value: FilterStatus; label: string }[] = [
        { value: 'all', label: 'All Users' },
        { value: 'free', label: 'Free' },
        { value: 'paid', label: 'Paid' },
        { value: 'lifetime', label: 'Lifetime' },
        { value: 'completed', label: 'Completed' },
        { value: 'inactive', label: 'Inactive' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">{totalCount} total users</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.value
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading users...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-400 text-sm mb-3">{error}</p>
                        <button onClick={fetchUsers} className="text-purple-400 hover:text-purple-300 text-sm transition">
                            Try again
                        </button>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">
                            {search ? `No users found matching "${search}"` : 'No users found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    {[
                                        { label: 'User', field: 'full_name' as SortField },
                                        { label: 'Plan', field: 'subscription_status' as SortField },
                                        { label: 'Workbook', field: null },
                                        { label: 'Status', field: null },
                                        { label: 'Joined', field: 'created_at' as SortField },
                                        { label: 'Actions', field: null },
                                    ].map(col => (
                                        <th
                                            key={col.label}
                                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.field ? 'cursor-pointer hover:text-gray-300 transition select-none' : ''
                                                }`}
                                            onClick={() => col.field && toggleSort(col.field)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.field && sort === col.field && (
                                                    <span className="text-purple-400">
                                                        {sortDir === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onDeactivate={handleDeactivate}
                                        onReactivate={handleReactivate}
                                        onViewDetails={setSelectedUser}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User detail modal */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
}