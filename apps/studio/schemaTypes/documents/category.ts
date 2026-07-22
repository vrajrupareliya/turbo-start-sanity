import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { iconField } from "@/schemaTypes/common";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  description:
    "A reusable topic used to organize blog posts and help readers browse related articles.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        "The category name readers will see, such as 'Sanity' or 'Backend'",
      validation: (Rule) =>
        Rule.required().error("A category title is required"),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "The URL-safe category identifier used in blog filter links, generated from the title",
      options: {
        source: "title",
        maxLength: 60,
        slugify: (value) =>
          value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
      },
      validation: (Rule) =>
        Rule.required().custom((value) => {
          if (!value?.current) {
            return "A category slug is required";
          }
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
            ? true
            : "Use lowercase letters, numbers, and single hyphens only";
        }),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description:
        "An optional summary of this topic for category page metadata and future UI",
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
      description:
        "An optional hexadecimal color for future category styling, for example #6366F1",
      validation: (Rule) =>
        Rule.regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/).warning(
          "Use a 3- or 6-digit hexadecimal color beginning with #"
        ),
    }),
    iconField,
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled Category",
      subtitle: subtitle || "Blog category",
    }),
  },
});
