'use server'

import { prisma } from '@/lib/prisma'
import { checkUser } from '@/lib/checkUser'
import { revalidatePath } from 'next/cache'
import { bookSchema } from '@/lib/validations'
import { AppError } from '@/lib/app-error'

// CREATE BOOK
export async function createBook(data: unknown) {
  try {
    const result = bookSchema.safeParse(data)
    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        result.error.flatten().fieldErrors
      )
    }

    const clerkId = await checkUser()
    if (!clerkId) {
      throw new AppError('Unauthorized - please log in', 401)
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const book = await prisma.book.create({
      data: {
        title: result.data.title,
        author: result.data.author,
        condition: result.data.condition,
        description: result.data.description,
        photos: result.data.photos,
        city: result.data.city,
        state: result.data.state,
        status: 'AVAILABLE',
        ownerId: user.id
      }
    })

    revalidatePath('/books')
    return { success: true, book }

  } catch (error) {
    return handleError(error)
  }
  
}

// UPDATE BOOK
export async function updateBook(id: string, data: unknown) {
  try {
    const result = bookSchema.safeParse(data)
    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        result.error.flatten().fieldErrors
      )
    }

    const clerkId = await checkUser()
    if (!clerkId) {
      throw new AppError('Unauthorized - please log in', 401)
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const book = await prisma.book.findUnique({
      where: { id }
    })

    if (!book) {
      throw new AppError('Book not found', 404)
    }

    if (book.ownerId !== user.id) {
      throw new AppError('You can only edit your own books', 403)
    }

    const updated = await prisma.book.update({
      where: { id },
      data: {
        title: result.data.title,
        author: result.data.author,
        condition: result.data.condition,
        description: result.data.description,
        photos: result.data.photos,
        city: result.data.city,
        state: result.data.state,
      }
    })

    revalidatePath('/books')
    revalidatePath(`/books/${id}`)
    return { success: true, book: updated }

  } catch (error) {
    return handleError(error)
  }
}

// DELETE BOOK
export async function deleteBook(id: string) {
  try {
    const clerkId = await checkUser()
    if (!clerkId) {
      throw new AppError('Unauthorized - please log in', 401)
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const book = await prisma.book.findUnique({
      where: { id }
    })

    if (!book) {
      throw new AppError('Book not found', 404)
    }

    if (book.ownerId !== user.id) {
      throw new AppError('You can only delete your own books', 403)
    }

    await prisma.book.delete({
      where: { id }
    })

    revalidatePath('/books')
    return { success: true }

  } catch (error) {
    return handleError(error)
  }
}

// CENTRALIZED ERROR HANDLER
function handleError(error: unknown) {
  if (error instanceof AppError) {
    if (error.fieldErrors) {
      return { error: error.message, fieldErrors: error.fieldErrors }
    }
    return { error: error.message, statusCode: error.statusCode }
  }

  console.error('Unexpected error:', error)
  return { error: 'Something went wrong', statusCode: 500 }
}