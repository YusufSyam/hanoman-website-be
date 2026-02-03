import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    lockTime: 20 * 60 * 1000, // 20 minutes in milliseconds
    maxLoginAttempts: 5,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    },
  },
  access: {
    read: ({ req: { user }, id }) => {
      // Admin can read all users
      if (user?.id) {
        // Allow users to read their own data
        if (id === user.id) return true
        // For admin panel, allow authenticated users to read (admin check happens in admin panel)
        return Boolean(user)
      }
      return false
    },
    create: ({ req: { user } }) => {
      // Only authenticated users (admin) can create users
      // Public registration is disabled
      return Boolean(user)
    },
    update: ({ req: { user } }) => {
      // Only authenticated users (admin) can update users
      return Boolean(user)
    },
    delete: ({ req: { user } }) => {
      // Only authenticated users (admin) can delete users
      return Boolean(user)
    },
  },
  fields: [

  ],
}
