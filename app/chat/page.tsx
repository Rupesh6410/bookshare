'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface ChatPreview {
  id: string
  requestId: string
  otherUserName: string
  otherUserCity: string
  bookTitle: string
  bookPhoto: string
  requestStatus: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function ChatListPage() {
  const { userId } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch all chat conversations for current user
  const { data, isLoading, error } = useQuery({
    queryKey: ['chat-list', userId, currentPage],
    queryFn: async () => {
      const response = await fetch(
        `/api/chat/list?page=${currentPage}&pageSize=10`
      )
      if (!response.ok) throw new Error('Failed to fetch chats')
      return response.json() as Promise<{
        chats: ChatPreview[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>
    },
    enabled: !!userId,
  })

  const chats = data?.chats || []
  const totalPages = data?.totalPages || 0

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to view your chats
          </p>
          <Link href="/" className="text-black dark:text-white font-medium hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm">
              Failed to load chats
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Loading chats...
            </p>
          </div>
        )}

        {/* No chats */}
        {!isLoading && chats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No conversations yet
            </p>
            <Link
              href="/"
              className="text-black dark:text-white font-medium hover:underline"
            >
              Browse and request books →
            </Link>
          </div>
        )}

        {/* Chat list */}
        {!isLoading && chats.length > 0 && (
          <>
            <div className="space-y-2">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4"
                >
                  <div className="flex gap-4">
                    {/* Book cover thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="relative w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        {chat.bookPhoto ? (
                          <Image
                            src={chat.bookPhoto}
                            alt={chat.bookTitle}
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

                    {/* Chat info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {chat.otherUserName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {chat.bookTitle}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            📍 {chat.otherUserCity}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                            chat.requestStatus === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : chat.requestStatus === 'ACCEPTED'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {chat.requestStatus}
                        </span>
                      </div>

                      {/* Last message preview */}
                      <div className="flex items-end justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {chat.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                          {chat.lastMessageTime && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {chat.lastMessageTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

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

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}