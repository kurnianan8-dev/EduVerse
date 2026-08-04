import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
            Halaman Tidak Ditemukan (404)
          </span>
          <h1 className="text-2xl font-display font-extrabold text-foreground mt-3">Halaman Tidak Ada</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Halaman atau tautan yang Anda tuju tidak valid atau telah dipindahkan.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};
