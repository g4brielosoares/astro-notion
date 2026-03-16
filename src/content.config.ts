import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/index.md"
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      status: z.string().default("Rascunho"),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional()
    })
});

export const collections = {
  blog
};