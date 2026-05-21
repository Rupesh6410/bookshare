'use server'

import { prisma } from '@/lib/prisma'
import { checkUser } from '@/lib/checkUser'
import redis from '@/lib/redis'
import logger from '@/lib/logger'
import { AppError } from '@/lib/app-error'

export async function requestBook(bookId: string) {
  try {
    logger.info('Creating book request', { bookId })

    const clerkId = await checkUser()
    if (!clerkId) {
      logger.warn('Unauthorized request attempt', { bookId })
      throw new AppError('Unauthorized - please log in', 401)
    }

    // Get requester user
    const requester = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!requester) {
      logger.warn('Requester user not found', { clerkId, bookId })
      throw new AppError('User not found', 404)
    }

    // Use transaction to handle concurrent requests safely
    const request = await prisma.$transaction(
      async (tx) => {
        // Lock the book row and check its current status
        const book = await tx.book.findUnique({
          where: { id: bookId }
        })

        if (!book) {
          logger.warn('Book not found for request', { bookId })
          throw new AppError('Book not found', 404)
        }

        // Check if requester is owner
        if (book.ownerId === requester.id) {
          logger.warn('User trying to request their own book', {
            bookId,
            userId: requester.id
          })
          throw new AppError('You cannot request your own book', 400)
        }

        // Check if book is still AVAILABLE
        if (book.status !== 'AVAILABLE') {
          logger.warn('Book no longer available', {
            bookId,
            currentStatus: book.status
          })
          throw new AppError(
            'This book is no longer available. Someone else may have requested it.',
            400
          )
        }

        // Check if this user already has a pending/accepted request for this book
        const existingRequest = await tx.request.findUnique({
          where: {
            bookId_requesterId: {
              bookId,
              requesterId: requester.id
            }
          }
        })

        if (existingRequest && existingRequest.status !== 'REJECTED') {
          logger.warn('Duplicate request attempt', {
            bookId,
            requesterId: requester.id,
            existingStatus: existingRequest.status
          })
          throw new AppError('You have already requested this book', 400)
        }

        // Check if there's already an accepted request for this book
        const acceptedRequest = await tx.request.findFirst({
          where: {
            bookId,
            status: 'ACCEPTED'
          }
        })

        if (acceptedRequest) {
          logger.warn('Book already has accepted request', {
            bookId,
            acceptedRequestId: acceptedRequest.id
          })
          throw new AppError(
            'This book already has an accepted request.',
            400
          )
        }

        // Create the request and update book status atomically
        const newRequest = await tx.request.create({
          data: {
            bookId,
            requesterId: requester.id,
            status: 'PENDING',
            chatRoom: {
              create: {}
            }
          },
          include: {
            chatRoom: true,
            book: {
              select: {
                title: true,
                owner: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        })

        // Update book status to REQUESTED
        await tx.book.update({
          where: { id: bookId },
          data: { status: 'REQUESTED' }
        })

        return newRequest
      },
      {
        timeout: 10000, // 10 second timeout
        maxWait: 5000, // Wait max 5 seconds for lock
        isolationLevel: 'Serializable' // Strongest isolation level
      }
    )

    logger.info('Book request created successfully', {
      requestId: request.id,
      bookId,
      requesterId: requester.id,
      bookTitle: request.book.title
    })

    // Invalidate Redis cache
    const keys = await redis.keys('books:browse:*')
    if (keys.length > 0) {
      await redis.del(...keys)
      logger.info('Browse books cache invalidated', { keysDeleted: keys.length })
    }

    return {
      success: true,
      request: {
        id: request.id,
        status: request.status,
        chatRoomId: request.chatRoom?.id
      }
    }
  } catch (error) {
    logger.error('Error creating book request', {
      bookId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof AppError) {
      return { error: error.message }
    }

    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return { error: 'You have already requested this book' }
    }

    return { error: 'Failed to request book' }
  }
}