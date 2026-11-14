import { Quote } from "lucide-react";
import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  type: "document",
  title: "Testimonial",
  description:
    "A customer quote or review highlighting their experience and success.",
  icon: Quote,
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      description: "The name of the person giving the testimonial",
      validation: (Rule) => Rule.required().error("Name is required"),
    }),
    defineField({
      name: "quote",
      type: "text",
      title: "Quote",
      description: "The testimonial quote or review",
      rows: 4,
      validation: (Rule) => Rule.required().error("Quote is required"),
    }),
    defineField({
      name: "author",
      type: "string",
      title: "Author / Title",
      description:
        "The role, company, or title of the author (e.g. 'CEO at Acme Corp')",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "quote",
      author: "author",
    },
    prepare: ({ title, subtitle, author }) => {
      const authorInfo = author ? ` (${author})` : "";
      return {
        title: `💬 ${title || "Untitled Testimonial"}${authorInfo}`,
        subtitle,
      };
    },
  },
});
