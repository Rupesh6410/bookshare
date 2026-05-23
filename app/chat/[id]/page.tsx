'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import logger from '@/lib/logger'

interface ChatMessage {
  id: string
  content: string
  senderName: string
  senderId: string
  createdAt: string
}

interface ChatDetails {
  id: string
  requestId: string
  bookTitle: string
  bookPhoto: string
  otherUserName: string
  otherUserId: string
  otherUserCity: string
  requestStatus: string
  messages: ChatMessage[]
  currentUserId: string
}

export default function ChatPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  const queryClient = useQueryClient()

  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chat details and messages
  const { data: chat, isLoading, error } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${chatId}`)
      if (!response.ok) throw new Error('Failed to fetch chat')
      return response.json() as Promise<ChatDetails>
    },
    enabled: !!chatId && !!userId,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  })

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to view chats
          </p>
          <Link href="/" className="text-black dark:text-white font-medium hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-red-800 dark:text-red-400 text-sm">
              Chat not found or you don't have access
            </p>
          </div>
          <Link
            href="/chat"
            className="text-black dark:text-white font-medium hover:underline"
          >
            ← Back to chats
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    )
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()

    if (!messageInput.trim()) return

    setIsSending(true)
    const contentToSend = messageInput

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatRoomId: chatId,
          content: contentToSend,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const newMessage = await response.json()

      // Update local cache
      queryClient.setQueryData(['chat', chatId], (old: ChatDetails) => ({
        ...old,
        messages: [...old.messages, newMessage],
      }))

      setMessageInput('')
      logger.info('Message sent', { chatId })
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/chat"
            className="text-black dark:text-white font-medium hover:underline"
          >
            ← Back
          </Link>

          <div className="flex-1 ml-4">
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {chat?.otherUserName}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {chat?.bookTitle}
            </p>
          </div>

          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              chat?.requestStatus === 'PENDING'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                : chat?.requestStatus === 'ACCEPTED'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            {chat?.requestStatus}
          </span>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
        {(!chat?.messages || chat.messages.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {chat?.messages.map((message) => {
          const isOwnMessage = message.senderId === chat.currentUserId

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-600 dark:text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto px-4 py-4 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !messageInput.trim()}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}