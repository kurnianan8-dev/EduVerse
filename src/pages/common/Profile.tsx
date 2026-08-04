import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/auth.types';
import { getRoleBadgeStyle } from '../../lib/utils';
import { Mail, Shield, Building, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, role } = useAuth();
  const style = getRoleBadgeStyle(role);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-foreground">Detail Profil Pengguna</h1>

      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-5 pb-6 border-b border-border">
          <img
            src={user?.avatarUrl}
            alt={user?.fullName}
            className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{user?.fullName}</h2>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Mail className="w-4 h-4 text-primary" /> Alamat Email
            </div>
            <p className="text-sm font-semibold text-foreground">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Shield className="w-4 h-4 text-purple-600" /> Peran Aktif
            </div>
            <p className="text-sm font-semibold text-foreground">{ROLE_LABELS[role]}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Building className="w-4 h-4 text-sky-600" /> Institusi Sekolah
            </div>
            <p className="text-sm font-semibold text-foreground">{user?.schoolName || 'Platform Utama'}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" /> Bergabung Sejak
            </div>
            <p className="text-sm font-semibold text-foreground">Agustus 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
