import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Venue } from '../../types';
import { getStatusColor } from '../../lib/utils';
import { PlusCircle, Building2, MapPin, Layers, ExternalLink, Settings } from 'lucide-react';

export const OwnerVenues: React.FC = () => {
  const navigate = useNavigate();

  const { data: venuesData, isLoading } = useQuery({
    queryKey: ['owner-venues'],
    queryFn: () => api.get<Venue[]>('/venues?limit=50'),
  });

  const venues = venuesData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Sports Venues</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your sports arenas, add playable grounds, and configure operating schedules.
          </p>
        </div>

        <Link
          to="/owner/venues/create"
          className="px-5 py-2.5 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Venue</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Venues Registered Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Get started by adding your sports turf. Once approved by admin, customers can discover and
            book slots directly.
          </p>
          <Link
            to="/owner/venues/create"
            className="px-5 py-2.5 bg-forest-900 text-turf-bright text-xs font-bold rounded-xl"
          >
            Add Your First Venue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100">
                  <img
                    src={v.images?.[0] || 'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=600'}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs bg-white/95 ${getStatusColor(
                        v.status
                      )}`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{v.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{v.address}, {v.city}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>
                      {v.grounds?.length || 0} Playable Grounds Configured
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                <Link
                  to={`/owner/venues/${v.id}/grounds`}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grounds</span>
                </Link>

                <Link
                  to={`/venues/${v.id}`}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                  title="View Public Page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
