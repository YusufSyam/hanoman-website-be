import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'category', 'publishedDate'],
  },
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'blog',
      options: [
        {
          label: 'News',
          value: 'news',
        },
        {
          label: 'Blog',
          value: 'blog',
        },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    slugField({
      name: 'slug',
      fieldToUse: 'title',
      localized: false,
      unique: true,
    }),
    {
      name: 'image',
      label: 'Featured Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'publishedDate',
      label: 'Published Date',
      type: 'date',
      required: true,
    },
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      label: 'Author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
    },
  ],
}


