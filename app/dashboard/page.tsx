'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { deleteBook } from '@/app/actions/book'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Book {
  id: string
  title: string
  author: string
  condition: string
  city: string
  photos: string[]
  status: string
  createdAt: string
}

interface PaginatedResponse {
  books: Book[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE = 6

export default function DashboardPage() {
  const { userId } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)

  // Fetch user's books with pagination
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-books', userId, currentPage],
    queryFn: async () => {
      const response = await fetch(
        `/api/books/my-books?page=${currentPage}&pageSize=${PAGE_SIZE}`
      )
      if (!response.ok) throw new Error('Failed to fetch your books')
      return response.json() as Promise<PaginatedResponse>
    },
    enabled: !!userId,
  })

  const books = data?.books || []
  const totalPages = data?.totalPages || 0

  function openDeleteDialog(bookId: string) {
    setBookToDelete(bookId)
    setShowDeleteDialog(true)
  }

  async function handleConfirmDelete() {
    if (!bookToDelete) return

    setDeletingId(bookToDelete)
    const result = await deleteBook(bookToDelete)

    if ('error' in result) {
      alert('Error: ' + result.error)
      setDeletingId(null)
      setShowDeleteDialog(false)
      return
    }

    refetch()
    setDeletingId(null)
    setShowDeleteDialog(false)
    setBookToDelete(null)
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to view your books
          </p>
          <Link 
            href="/" 
            className="text-black dark:text-white font-medium hover:underline"
          >
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Books
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                You have listed {data?.total || 0} {data?.total === 1 ? 'book' : 'books'}
              </p>
            </div>
            <Link
              href="/books/upload"
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Share a book
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm">
              Failed to load your books
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Loading your books...
            </p>
          </div>
        )}

        {/* No books */}
        {!isLoading && books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't shared any books yet
            </p>
            <Link
              href="/books/upload"
              className="text-black dark:text-white font-medium hover:underline"
            >
              Share your first book →
            </Link>
          </div>
        )}

        {/* Books grid */}
        {!isLoading && books.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  {/* Book cover image */}
                  <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {book.photos && book.photos.length > 0 ? (
                      <Image
                        src={book.photos[0]}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          No cover
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Book info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                      {book.author}
                    </p>

                    {/* Metadata */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {book.condition}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          book.status === 'AVAILABLE'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : book.status === 'REQUESTED'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {book.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {book.city}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/books/${book.id}`}
                        className="flex-1 bg-black dark:bg-white text-white dark:text-black text-center py-2 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
                      >
                        View
                      </Link>
                      <Link
                        href={`/books/${book.id}/edit`}
                        className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-center py-2 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => openDeleteDialog(book.id)}
                        disabled={deletingId === book.id}
                        className="flex-1 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 py-2 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                      >
                        {deletingId === book.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Page info */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Delete book?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. The book will be permanently deleted from your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}