'use client'

import { useState } from 'react'
import { useBrowseBooks } from '@/lib/use-browse-books'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { requestBook } from '@/app/actions/request'
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

export default function HomePage() {
  const { userId } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [city, setCity] = useState('')
  const [search, setSearch] = useState('')
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const { data, isLoading, error } = useBrowseBooks({
    city,
    search,
    page: currentPage,
    pageSize: 12,
  })

  const books = data?.books || []
  const totalPages = data?.totalPages || 0

  function openRequestDialog(bookId: string) {
    if (!userId) {
      alert('Please log in to request a book')
      return
    }
    setRequestingBookId(bookId)
    setRequestError(null)
    setShowRequestDialog(true)
  }

  async function handleRequestBook() {
    if (!requestingBookId) return

    setIsSubmitting(true)
    setRequestError(null)

    const result = await requestBook(requestingBookId)

    if ('error' in result) {
      setRequestError(result.error || 'Failed to request book')
      setIsSubmitting(false)
      return
    }

    setShowRequestDialog(false)
    setRequestingBookId(null)
    setIsSubmitting(false)
    alert('Book requested successfully! Check your requests.')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Discover Books Near You
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find and request books from your community
            </p>
          </div>

          {/* Search and filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search books
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* City filter */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by city
              </label>
              <input
                id="city"
                type="text"
                placeholder="e.g., Delhi, Mumbai, Bangalore"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Share button */}
          {userId && (
            <Link
              href="/books/upload"
              className="inline-block mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Share a book
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm">
              Failed to load books
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Loading books...
            </p>
          </div>
        )}

        {/* No results */}
        {!isLoading && books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No books found
            </p>
            {!userId && (
              <Link
                href="/sign-in"
                className="text-black dark:text-white font-medium hover:underline"
              >
                Sign in to share books →
              </Link>
            )}
          </div>
        )}

        {/* Books grid */}
        {!isLoading && books.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
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
                        className="object-cover group-hover:scale-105 transition"
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
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {book.condition}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {book.city}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {book.owner.name}
                      </p>
                    </div>

                    {/* Request button */}
                    <button
                      onClick={() => openRequestDialog(book.id)}
                      className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-2 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition"
                    >
                      Request book
                    </button>
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Request confirmation dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Request this book?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              {requestError ? (
                <span className="text-red-600 dark:text-red-400">{requestError}</span>
              ) : (
                'A chat room will be created for you to coordinate with the owner.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestBook}
              disabled={isSubmitting}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {isSubmitting ? 'Requesting...' : 'Request book'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}