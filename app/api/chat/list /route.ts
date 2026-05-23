import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { checkUser } from '@/lib/checkUser'

export async function GET(req: Request) {
  const  userId  = checkUser()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all chat rooms for this user (both as requester and book owner)
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          // Chats where user is the requester
          {
            request: {
              requesterId: user.id
            }
          },
          // Chats where user is the book owner
          {
            request: {
              book: {
                ownerId: user.id
              }
            }
          }
        ]
      },
      include: {
        request: {
          include: {
            requester: {
              select: { id: true, name: true, city: true }
            },
            book: {
              select: { id: true, title: true, photos: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Get total count
    const total = await prisma.chatRoom.count({
      where: {
        OR: [
          { request: { requesterId: user.id } },
          { request: { book: { ownerId: user.id } } }
        ]
      }
    })

    const totalPages = Math.ceil(total / pageSize)

    // Format response
    const chats = chatRooms.map((room) => {
      const isRequester = room.request.requesterId === user.id
      const otherUser = isRequester ? room.request.book.owner : room.request.requester

      return {
        id: room.id,
        requestId: room.request.id,
        otherUserName: otherUser.name,
        otherUserCity: otherUser.city,
        bookTitle: room.request.book.title,
        bookPhoto: room.request.book.photos?.[0] || '',
        requestStatus: room.request.status,
        lastMessage: room.messages[0]?.content || '',
        lastMessageTime: room.messages[0]
          ? formatTime(new Date(room.messages[0].createdAt))
          : '',
        unreadCount: 0, // TODO: implement unread logic
      }
    })

    logger.info('Chat list fetched', {
      userId: user.id,
      count: chats.length,
      page,
      totalPages
    })

    return Response.json({
      chats,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    logger.error('Error fetching chat list', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return Response.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}