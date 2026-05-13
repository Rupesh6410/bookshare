import { z } from "zod"

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  condition: z.enum(['LIKE_NEW', 'GOOD', 'WORN']),
  description: z.string().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  photos: z
    .array(z.string().url())
    .default([]) 
    .transform((photos) => 
      photos && photos.length > 0 
        ? photos 
        : ["https://via.placeholder.com/300x400?text=Book+Cover"]
    ),
})

export type BookInput = z.infer<typeof bookSchema>