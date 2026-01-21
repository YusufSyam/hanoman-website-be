import type { CollectionConfig } from 'payload'

export const Gallery: CollectionConfig = {
  slug: 'gallery',
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'image', 'createdAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'image',
      label: 'Photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      label: 'Caption',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}

