import React from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'Pengguna',
  className = '',
  size = 'md',
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Reset image error if src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  // Generate initials (e.g., "Kurnianto" -> "KU", "Ahmad Fauzi" -> "AF")
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover border border-border/50 shadow-sm shrink-0 ${className || sizeClasses[size]}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white font-bold flex items-center justify-center shadow-md select-none shrink-0 border border-white/20 ${
        className || sizeClasses[size]
      }`}
    >
      {getInitials(name)}
    </div>
  );
};
