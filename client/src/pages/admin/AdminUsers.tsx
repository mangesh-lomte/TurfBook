import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { User } from '../../types';
import { formatDate } from '../../lib/utils';
import { Users, Shield, UserCheck, UserX, Mail, Phone, Search, Filter } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'OWNER' | 'ADMIN'>('ALL');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<User[]>('/admin/users'),
  });

  const users = usersData || [];

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/admin/users/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Platform Users Directory
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Directory of registered customers, venue owners, and platform administrators.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-turfborder rounded-2xl w-full sm:w-80 focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600 shadow-xs transition-all">
            <Search className="w-4 h-4 text-charcoal-muted shrink-0" />
            <label htmlFor="search-users" className="sr-only">
              Search users
            </label>
            <input
              id="search-users"
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-charcoal focus:outline-none placeholder:text-charcoal-muted/60 font-medium"
            />
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-turfborder pb-3 mb-6 overflow-x-auto">
          {(['ALL', 'CUSTOMER', 'OWNER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                roleFilter === r
                  ? 'bg-gradient-brand text-white font-black shadow-brand'
                  : 'bg-white text-charcoal-muted border border-turfborder hover:bg-forest-50/60'
              }`}
            >
              {r === 'ALL'
                ? `All Users (${users.length})`
                : r === 'CUSTOMER'
                ? 'Players / Customers'
                : r === 'OWNER'
                ? 'Turf Owners'
                : 'Administrators'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="h-64 bg-forest-50/60 rounded-3xl animate-pulse border border-turfborder" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-turfborder p-8 max-w-md mx-auto shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-charcoal">No Users Found</h3>
            <p className="text-xs text-charcoal-muted mt-1">Try clearing your search term or selecting another role.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-turfborder overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#F8FAF7] border-b border-turfborder text-charcoal-muted font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact Phone</th>
                    <th className="px-6 py-4">Registered Date</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-turfborder">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-forest-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-charcoal text-sm">{u.fullName}</div>
                        <div className="text-charcoal-muted font-mono text-[11px] mt-0.5">{u.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : u.role === 'OWNER'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-forest-50 text-forest-900 border-emerald-100'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-charcoal-muted font-medium">
                        <div>{u.phone || 'No phone'}</div>
                      </td>

                      <td className="px-6 py-4 text-charcoal-muted">
                        <div>{formatDate(u.createdAt)}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-black ${
                            u.isActive ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isActive ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })
                            }
                            disabled={toggleStatusMutation.isPending}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              u.isActive
                                ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                                : 'bg-forest-50 text-forest-900 hover:bg-forest-100 border border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
