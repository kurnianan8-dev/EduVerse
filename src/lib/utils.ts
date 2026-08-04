import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppRole, ROLE_COLORS, ROLE_LABELS } from '../types/auth.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRoleName(role: AppRole): string {
  return ROLE_LABELS[role] || role;
}

export function getRoleBadgeStyle(role: AppRole) {
  return ROLE_COLORS[role] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
  };
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
