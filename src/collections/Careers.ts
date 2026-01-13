import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Careers: CollectionConfig = {
  slug: 'careers',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'jobCategory', 'isUrgentlyHiring'],
  },
  fields: [
    {
      name: 'title',
      label: 'Job Title',
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
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'requirements',
      label: 'Requirements',
      type: 'array',
      fields: [
        {
          name: 'item',
          label: 'Requirement',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'mainJobDescription',
      label: 'Main Job Description',
      type: 'array',
      fields: [
        {
          name: 'item',
          label: 'Job Description Item',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'isUrgentlyHiring',
      label: 'Urgently Hiring',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'jobCategory',
      label: 'Job Category',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Technology & Engineering',
          value: 'Technology & Engineering',
        },
        {
          label: 'Marketing, Sales & Communication',
          value: 'Marketing, Sales & Communication',
        },
        {
          label: 'Finance & Accounting',
          value: 'Finance & Accounting',
        },
        {
          label: 'Human Resources & General Affairs',
          value: 'Human Resources & General Affairs',
        },
        {
          label: 'Creative & Design',
          value: 'Creative & Design',
        },
        {
          label: 'Operations & Customer Success',
          value: 'Operations & Customer Success',
        },
      ],
    },
  ],
}


