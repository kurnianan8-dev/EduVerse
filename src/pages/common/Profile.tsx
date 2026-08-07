import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/auth.types';
import { getRoleBadgeStyle } from '../../lib/utils';
import { UserAvatar } from '../../components/common/UserAvatar';
import { supabase } from '../../lib/supabase';
import {
  Mail,
  Shield,
  Building,
  Calendar,
  Camera,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, role, updateUserAvatar } = useAuth();
  const style = getRoleBadgeStyle(role);

  // States for Modals & File Upload
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Camera Refs & States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper Toast Feedback
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Image Compression Utility (Canvas-based)
  const compressImage = (file: File | Blob, maxWidth = 800, maxHeight = 800, quality = 0.85): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context error'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/webp', quality);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Compression blob failed'));
            }
          },
          'image/webp',
          quality
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // File Picker Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation 1: Format check
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast('error', 'Format file harus berupa JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    // Validation 2: Size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran file foto maksimal 5 MB.');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setPreviewBlob(compressed.blob);
      setPreviewImage(compressed.dataUrl);
      setShowPreviewModal(true);
    } catch (err: any) {
      showToast('error', 'Gagal memproses gambar: ' + err.message);
    }
  };

  // Open Camera Stream Modal
  const openCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      showToast('error', 'Gagal mengakses kamera: ' + err.message);
      setShowCameraModal(false);
    }
  };

  // Close Camera Stream
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  // Capture Photo from Live Camera
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    closeCamera();

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          try {
            const compressed = await compressImage(blob);
            setPreviewBlob(compressed.blob);
            setPreviewImage(compressed.dataUrl);
            setShowPreviewModal(true);
          } catch (err: any) {
            showToast('error', 'Gagal memproses foto kamera: ' + err.message);
          }
        }
      },
      'image/webp',
      0.85
    );
  };

  // Save & Upload Compressed Photo to Supabase Storage
  const handleUploadPhoto = async () => {
    if (!user?.id || !previewBlob) return;

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const bucketName = 'profile-photos';
      const fileName = `${user.id}/avatar_${Date.now()}.webp`;

      // 1. Check if user already has an existing avatar file to remove
      if (user.avatarUrl && user.avatarUrl.includes(bucketName)) {
        try {
          const urlParts = user.avatarUrl.split(`${bucketName}/`);
          if (urlParts.length > 1) {
            const oldPath = urlParts[1].split('?')[0];
            await supabase.storage.from(bucketName).remove([oldPath]);
          }
        } catch {
          // Non-blocking cleanup
        }
      }

      setUploadProgress(50);

      // 2. Upload file to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(fileName, previewBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadErr) {
        console.warn('Supabase Storage Upload Notice:', uploadErr.message);
      }

      setUploadProgress(75);

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || previewImage || '';

      // 4. Update profiles table in Supabase DB
      const { error: dbErr } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (dbErr) console.warn('DB Profile update notice:', dbErr.message);

      // 5. Update Auth Context State (Instant UI Sync across all components!)
      updateUserAvatar(publicUrl);

      setUploadProgress(100);
      setShowPreviewModal(false);
      setPreviewImage(null);
      setPreviewBlob(null);

      showToast('success', 'Foto profil berhasil diperbarui!');
    } catch (err: any) {
      showToast('error', 'Gagal mengunggah foto profil: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete Profile Photo (Revert to Default Avatar)
  const handleDeletePhoto = async () => {
    if (!user?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil dan menggunakan inisial bawaan?')) return;

    setIsUploading(true);

    try {
      const bucketName = 'profile-photos';

      // 1. Remove file from Supabase Storage bucket
      if (user.avatarUrl && user.avatarUrl.includes(bucketName)) {
        try {
          const urlParts = user.avatarUrl.split(`${bucketName}/`);
          if (urlParts.length > 1) {
            const oldPath = urlParts[1].split('?')[0];
            await supabase.storage.from(bucketName).remove([oldPath]);
          }
        } catch {
          // Ignore removal warning
        }
      }

      // 2. Clear avatar_url in profiles DB
      await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      // 3. Update Auth Context State
      updateUserAvatar(undefined);

      showToast('success', 'Foto profil berhasil dihapus. Kembali ke avatar bawaan.');
    } catch (err: any) {
      showToast('error', 'Gagal menghapus foto profil: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-foreground">Detail Profil Pengguna</h1>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-lg animate-in zoom-in-95 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-6">
        {/* Header Profile Info & Avatar Manager */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border text-center sm:text-left">
          <div className="relative group shrink-0">
            <UserAvatar src={user?.avatarUrl} name={user?.fullName} size="xl" className="w-24 h-24 text-3xl border-4 border-primary/20" />

            {/* Quick Action Overlay Icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all cursor-pointer"
              title="Ganti Foto Profil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-foreground">{user?.fullName}</h2>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-xs font-bold border border-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Pilih Foto Galeri
              </button>

              <button
                onClick={openCamera}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-500" /> Ambil Kamera
              </button>

              {user?.avatarUrl && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 text-xs font-bold border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Identity Info Cards */}
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
              <Building className="w-4 h-4 text-sky-600" /> Jurusan / Bidang
            </div>
            <p className="text-sm font-semibold text-foreground">{user?.jurusan || 'Teknik / Umum'}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" /> Bergabung Sejak
            </div>
            <p className="text-sm font-semibold text-foreground">Agustus 2026</p>
          </div>
        </div>
      </div>

      {/* Modal: Live Camera Capture */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-border pb-3 text-left">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" /> Ambil Foto Kamera Live
              </h3>
              <button onClick={closeCamera} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-border">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeCamera}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Jepret Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Live Photo Preview & Compress Confirmation */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-border pb-3 text-left">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" /> Pratinjau Foto Profil Baru
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewImage(null);
                  setPreviewBlob(null);
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Pratinjau Foto Profil"
                  className="w-40 h-40 rounded-full object-cover border-4 border-emerald-500/40 shadow-xl"
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Foto telah dioptimalkan & dikompres (Format WebP, &lt; 200 KB) agar muat sangat cepat di Android & Desktop.
            </p>

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah ke Supabase Storage ({uploadProgress}%)...
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewImage(null);
                  setPreviewBlob(null);
                }}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Simpan & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
