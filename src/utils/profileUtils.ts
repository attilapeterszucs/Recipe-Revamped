import { type User } from 'firebase/auth';

/**
 * Get user initials from display name or email
 * Returns 2 uppercase letters (or 1 if only one name)
 */
export const getUserInitials = (user: User): string => {
  if (user.displayName) {
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (user.email) {
    return user.email[0].toUpperCase();
  }

  return 'U';
};
