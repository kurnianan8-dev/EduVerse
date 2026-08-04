import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/auth.types';

export const Unauthorized: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
            Akses Ditolak (403)
          </span>
          <h1 className="text-2xl font-display font-extrabold text-foreground mt-3">Akses Dibatasi</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Peran akun Anda saat ini (<strong className="text-foreground">{ROLE_LABELS[role]}</strong>) tidak memiliki izin untuk mengakses bagian ini berdasarkan aturan akses (RBAC).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-accent flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <Link
            to={`/dashboard/${role.replace('_', '-')}`}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Dasbor Saya
          </Link>
        </div>
      </div>
    </div>
  );
};
