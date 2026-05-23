import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { checkUser } from '@/lib/checkUser'

export async function POST(req: Request) {
  const userId = checkUser()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { chatRoomId, content } = await req.json()

    if (!chatRoomId || !content?.trim()) {
      return Response.json(
        { error: 'chatRoomId and content are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        request: {
          select: {
            requesterId: true,
            book: {
              select: { ownerId: true }
            }
          }
        }
      }
    })

    if (!chatRoom) {
      return Response.json({ error: 'Chat room not found' }, { status: 404 })
    }

    const isRequester = chatRoom.request.requesterId === user.id
    const isOwner = chatRoom.request.book.ownerId === user.id

    if (!isRequester && !isOwner) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        chatRoomId,
        senderId: user.id,
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    })

    logger.info('Message created', {
      userId: user.id,
      chatRoomId,
      messageId: message.id
    })

    return Response.json({
      id: message.id,
      content: message.content,
      senderName: message.sender.name,
      senderId: message.sender.id,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    logger.error('Error creating message', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}