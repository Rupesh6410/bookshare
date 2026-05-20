import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EditBookForm from './edit-book-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditBookPage({ params }: PageProps) {
  const { id: bookId } = await params // ← await params here
  
  const { userId } =  await auth()

  if (!userId) {
    redirect('/')
  }

  // Get user from DB
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    redirect('/')
  }

  // Get book from DB directly
  const book = await prisma.book.findUnique({
    where: { id: bookId } // ← now it's defined
  })

  if (!book) {
    redirect('/dashboard')
  }

  // Verify ownership
  if (book.ownerId !== user.id) {
    redirect('/dashboard')
  }

  return <EditBookForm initialBook={book} />
}