import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'href'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      label: 'Client Name',
      type: 'text',
      required: true,
    },
    {
      name: 'href',
      label: 'Website URL',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Banking & Finance',
          value: 'Banking & Finance',
        },
        {
          label: 'Enterprise & Industrial',
          value: 'Enterprise & Industrial',
        },
        {
          label: 'Government',
          value: 'Government',
        },
      ],
    },
    {
      name: 'imageHeight',
      label: 'Image Height',
      type: 'number',
    },
  ],
}


