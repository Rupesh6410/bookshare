import { prisma } from '@/lib/prisma'
import { checkUser } from '@/lib/checkUser'
import logger from '@/lib/logger'

export async function GET(req: Request) {
  const userId = await checkUser()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all requests for books owned by this user
    const requests = await prisma.request.findMany({
      where: {
        book: {
          ownerId: user.id
        }
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            photos: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    logger.info('Incoming requests fetched', {
      userId: user.id,
      count: requests.length
    })

    return Response.json(requests)
  } catch (error) {
    logger.error('Error fetching incoming requests', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return Response.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}