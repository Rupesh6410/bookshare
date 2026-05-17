import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '6')

    // Validate pagination params
    if (page < 1 || pageSize < 1) {
      return Response.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Get total count
    const total = await prisma.book.count({
      where: { ownerId: user.id }
    })

    // Fetch paginated books
    const books = await prisma.book.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalPages = Math.ceil(total / pageSize)

    return Response.json({
      books,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}