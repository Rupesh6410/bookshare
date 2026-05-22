'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { acceptRequest, rejectRequest } from '@/app/actions/request-management'
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

interface BookRequest {
  id: string
  status: string
  createdAt: string
  requester: {
    id: string
    name: string
    city: string
  }
  book: {
    id: string
    title: string
    author: string
    photos: string[]
    city: string
  }
}

export default function RequestsPage() {
  const { userId } = useAuth()
  const [actionRequestId, setActionRequestId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch owner's incoming requests
  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['my-requests', userId],
    queryFn: async () => {
      const response = await fetch('/api/requests/incoming')
      if (!response.ok) throw new Error('Failed to fetch requests')
      return response.json() as Promise<BookRequest[]>
    },
    enabled: !!userId,
  })

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to see book requests
          </p>
          <Link href="/" className="text-black dark:text-white font-medium hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  function openDialog(requestId: string, type: 'accept' | 'reject') {
    setActionRequestId(requestId)
    setActionType(type)
    setShowDialog(true)
  }

  async function handleAction() {
    if (!actionRequestId || !actionType) return

    setIsSubmitting(true)

    const result =
      actionType === 'accept'
        ? await acceptRequest(actionRequestId)
        : await rejectRequest(actionRequestId)

    if ('error' in result) {
      alert('Error: ' + result.error)
      setIsSubmitting(false)
      return
    }

    // Refresh requests
    refetch()
    setShowDialog(false)
    setActionRequestId(null)
    setActionType(null)
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Book Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                People want to borrow your books
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-black dark:text-white font-medium hover:underline"
            >
              ← Back to my books
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
              Failed to load requests
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Loading requests...
            </p>
          </div>
        )}

        {/* No requests */}
        {!isLoading && requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No one has requested your books yet
            </p>
            <Link
              href="/dashboard"
              className="text-black dark:text-white font-medium hover:underline"
            >
              View your books →
            </Link>
          </div>
        )}

        {/* Requests list */}
        {!isLoading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex gap-6">
                  {/* Book cover */}
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {request.book.photos && request.book.photos.length > 0 ? (
                        <Image
                          src={request.book.photos[0]}
                          alt={request.book.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            No cover
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request info */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {request.book.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {request.book.author}
                      </p>
                    </div>

                    {/* Requester info */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Requested by:
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {request.requester.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {request.requester.city}
                      </p>
                    </div>

                    {/* Request status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : request.status === 'ACCEPTED'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {request.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    {request.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDialog(request.id, 'accept')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => openDialog(request.id, 'reject')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
                        >
                          Reject
                        </button>
                        <Link
                          href={`/chat/${request.id}`}
                          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          Chat
                        </Link>
                      </div>
                    )}

                    {request.status === 'ACCEPTED' && (
                      <div className="flex gap-2">
                        <Link
                          href={`/chat/${request.id}`}
                          className="flex-1 bg-black dark:bg-white text-white dark:text-black font-medium py-2 rounded-lg text-center hover:bg-gray-800 dark:hover:bg-gray-200 transition"
                        >
                          Open Chat
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              {actionType === 'accept' ? 'Accept request?' : 'Reject request?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              {actionType === 'accept'
                ? 'Once you accept, other requests for this book will be rejected and a chat will open.'
                : 'The requester will be notified of your rejection.'}
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
              onClick={handleAction}
              disabled={isSubmitting}
              className={`${
                actionType === 'accept'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : actionType === 'accept' ? 'Accept' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}