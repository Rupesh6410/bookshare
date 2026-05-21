import { useQuery } from '@tanstack/react-query'

export interface BrowseBook {
  id: string
  title: string
  author: string
  condition: string
  city: string
  state: string
  photos: string[]
  status: string
  createdAt: Date  
  owner: {
    id: string
    name: string
  }
}

interface BrowseBooksResponse {
  books: BrowseBook[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface BrowseBooksParams {
  city?: string
  search?: string
  page?: number
  pageSize?: number
}

export function useBrowseBooks(params: BrowseBooksParams = {}) {
  const queryParams = new URLSearchParams()
  
  if (params.city) queryParams.append('city', params.city)
  if (params.search) queryParams.append('search', params.search)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

  return useQuery({
    queryKey: ['browse-books', params.city, params.search, params.page, params.pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/books/browse?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch books')
      return response.json() as Promise<BrowseBooksResponse>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches Redis TTL)
  })
}