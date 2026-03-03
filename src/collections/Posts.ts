import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

function getReadTimeFromPublishedDate(publishedDate: string | null | undefined): string {
  if (!publishedDate) {
    return '0 minute'
  }

  const publishedTimestamp = new Date(publishedDate).getTime()

  if (Number.isNaN(publishedTimestamp)) {
    return '0 minute'
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - publishedTimestamp) / 1000))
  const minuteInSeconds = 60
  const hourInSeconds = 60 * minuteInSeconds
  const dayInSeconds = 24 * hourInSeconds
  const weekInSeconds = 7 * dayInSeconds
  const monthInSeconds = 30 * dayInSeconds

  if (diffInSeconds < hourInSeconds) {
    const minutes = Math.max(1, Math.floor(diffInSeconds / minuteInSeconds))
    return `${minutes} minute`
  }

  if (diffInSeconds < dayInSeconds) {
    const hours = Math.floor(diffInSeconds / hourInSeconds)
    return `${hours} hour`
  }

  if (diffInSeconds < weekInSeconds) {
    const days = Math.floor(diffInSeconds / dayInSeconds)
    return `${days} day`
  }

  if (diffInSeconds < monthInSeconds) {
    const weeks = Math.floor(diffInSeconds / weekInSeconds)
    return `${weeks} week`
  }

  const months = Math.floor(diffInSeconds / monthInSeconds)
  return `${months} month`
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'category', 'publishedDate'],
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
    delete: ({ req: { user } }) => Boolean(user), // Only authenticated users (admin)
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (!doc || typeof doc !== 'object') {
          return doc
        }

        const postDoc = doc as Record<string, unknown>
        const publishedDate =
          typeof postDoc.publishedDate === 'string' ? postDoc.publishedDate : undefined

        return {
          ...postDoc,
          readTime: getReadTimeFromPublishedDate(publishedDate),
        }
      },
    ],
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
    {
      name: 'readTime',
      label: 'Read Time',
      type: 'text',
      virtual: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}


