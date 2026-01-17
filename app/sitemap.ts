import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://darshan-ai.vercel.app",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: "https://darshan-ai.vercel.app/pilgrim",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://darshan-ai.vercel.app/admin",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://darshan-ai.vercel.app/police",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://darshan-ai.vercel.app/medical",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ]
}
