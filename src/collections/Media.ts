import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
    delete: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
