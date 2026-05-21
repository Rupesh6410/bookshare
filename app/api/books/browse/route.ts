import { prisma } from '@/lib/prisma'
import redis from '@/lib/redis'
import logger from '@/lib/logger'

const CACHE_TTL = 300 // 5 minutes

interface Book {
  id: string
  title: string
  author: string
  condition: string
  city: string
  state: string
  photos: string[]
  status: string
  createdAt: string
  owner: {
    id: string
    name: string
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const city = searchParams.get('city') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '12')

  // Create cache key
  const cacheKey = `books:browse:city=${city}:search=${search}:page=${page}:pageSize=${pageSize}`

  try {
    // Try to get from Redis cache
    const cachedData = await redis.get(cacheKey)
    
    if (cachedData) {
      logger.info('Redis cache hit for browse books', { cacheKey })
      return Response.json(JSON.parse(cachedData))
    }

    logger.info('Redis cache miss, fetching from database', { cacheKey, city, search })

    // Build where clause
    const where: any = { status: 'AVAILABLE' }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.book.findMany({
      where,
      select: { id: true }
    })

 // Get paginated books
    const books = await prisma.book.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalPages = Math.ceil(total.length / pageSize)

    const response = {
      books,
      total: total.length,
      page,
      pageSize,
      totalPages,
    }

    // Store in Redis cache with TTL
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response))
    
    logger.info('Books fetched and cached in Redis', {
      count: books.length,
      cacheKey,
      ttl: CACHE_TTL,
      city,
      search
    })

    return Response.json(response)
  } catch (error) {
    logger.error('Error fetching browse books', {
      error: error instanceof Error ? error.message : 'Unknown error',
      city,
      search,
    })
    return Response.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}