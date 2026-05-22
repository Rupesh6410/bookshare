'use server'

import { prisma } from '@/lib/prisma'
import { checkUser } from '@/lib/checkUser'
import redis from '@/lib/redis'
import logger from '@/lib/logger'
import { AppError } from '@/lib/app-error'

export async function acceptRequest(requestId: string) {
  try {
    logger.info('Accepting request', { requestId })

    const clerkId = await checkUser()
    if (!clerkId) {
      throw new AppError('Unauthorized', 401)
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const request = await prisma.$transaction(
      async (tx) => {
        // Get the request with book info
        const req = await tx.request.findUnique({
          where: { id: requestId },
          include: { book: true }
        })

        if (!req) {
          throw new AppError('Request not found', 404)
        }

        // Verify ownership of book
        if (req.book.ownerId !== user.id) {
          logger.warn('Unauthorized accept attempt', {
            requestId,
            userId: user.id,
            bookOwnerId: req.book.ownerId
          })
          throw new AppError('You can only accept requests for your own books', 403)
        }

        if (req.status !== 'PENDING') {
          throw new AppError('This request is no longer pending', 400)
        }

        // Accept this request
        const accepted = await tx.request.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        })

        // Reject all other pending requests for this book
        await tx.request.updateMany({
          where: {
            bookId: req.bookId,
            id: { not: requestId },
            status: 'PENDING'
          },
          data: { status: 'REJECTED' }
        })

        // Update book status to SHARED
        await tx.book.update({
          where: { id: req.bookId },
          data: { status: 'SHARED' }
        })

        return accepted
      },
      {
        timeout: 10000,
        isolationLevel: 'Serializable'
      }
    )

    logger.info('Request accepted successfully', {
      requestId,
      userId: user.id
    })

    // Clear cache
    const keys = await redis.keys('books:browse:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return { success: true, request }
  } catch (error) {
    logger.error('Error accepting request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    if (error instanceof AppError) {
      return { error: error.message }
    }

    return { error: 'Failed to accept request' }
  }
}

export async function rejectRequest(requestId: string) {
  try {
    logger.info('Rejecting request', { requestId })

    const clerkId = await checkUser()
    if (!clerkId) {
      throw new AppError('Unauthorized', 401)
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const request = await prisma.$transaction(
      async (tx) => {
        const req = await tx.request.findUnique({
          where: { id: requestId },
          include: { book: true }
        })

        if (!req) {
          throw new AppError('Request not found', 404)
        }

        // Verify ownership
        if (req.book.ownerId !== user.id) {
          throw new AppError('You can only reject requests for your own books', 403)
        }

        // Reject this request
        const rejected = await tx.request.update({
          where: { id: requestId },
          data: { status: 'REJECTED' }
        })

        // If no accepted requests exist, set book back to AVAILABLE
        const acceptedCount = await tx.request.count({
          where: {
            bookId: req.bookId,
            status: 'ACCEPTED'
          }
        })

        if (acceptedCount === 0) {
          await tx.book.update({
            where: { id: req.bookId },
            data: { status: 'AVAILABLE' }
          })
        }

        return rejected
      },
      {
        timeout: 10000,
        isolationLevel: 'Serializable'
      }
    )

    logger.info('Request rejected successfully', {
      requestId,
      userId: user.id
    })

    // Clear cache
    const keys = await redis.keys('books:browse:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return { success: true, request }
  } catch (error) {
    logger.error('Error rejecting request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    if (error instanceof AppError) {
      return { error: error.message }
    }

    return { error: 'Failed to reject request' }
  }
}