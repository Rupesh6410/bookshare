import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { checkUser } from '@/lib/checkUser'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = checkUser()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        request: {
          include: {
            requester: {
              select: { id: true, name: true, city: true }
            },
            book: {
              select: { id: true, title: true, photos: true, ownerId: true },
              include: {
                owner: {
                  select: { id: true, name: true, city: true }
                }
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 50, // Load last 50 messages
        }
      }
    })

    if (!chatRoom) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Verify user has access to this chat
    const isRequester = chatRoom.request.requesterId === user.id
    const isOwner = chatRoom.request.book.ownerId === user.id

    if (!isRequester && !isOwner) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine other user
    const otherUser = isRequester ? chatRoom.request.book.owner : chatRoom.request.requester

    const response = {
      id: chatRoom.id,
      requestId: chatRoom.request.id,
      bookTitle: chatRoom.request.book.title,
      bookPhoto: chatRoom.request.book.photos?.[0] || '',
      otherUserName: otherUser.name,
      otherUserId: otherUser.id,
      otherUserCity: otherUser.city,
      requestStatus: chatRoom.request.status,
      currentUserId: user.id,
      messages: chatRoom.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderName: msg.sender.name,
        senderId: msg.sender.id,
        createdAt: msg.createdAt.toISOString(),
      })),
    }

    logger.info('Chat fetched', {
      userId: user.id,
      chatId: params.id,
      messageCount: chatRoom.messages.length
    })

    return Response.json(response)
  } catch (error) {
    logger.error('Error fetching chat', {
      chatId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return Response.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}