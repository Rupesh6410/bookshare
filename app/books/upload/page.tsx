'use client'

import { createBook } from '@/app/actions/book'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]>
  >({})

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setLoading(true)
    setError(null)
    setFieldErrors({})

    const form = new FormData(e.currentTarget)

    const data = {
      title: form.get('title'),
      author: form.get('author'),
      condition: form.get('condition'),
      city: form.get('city'),
      state: form.get('state'),
      description: form.get('description'),
      photos: [],
    }

    try {
      const result = await createBook(data)

      if ('error' in result) {
        if ('fieldErrors' in result) {
          setFieldErrors(result.fieldErrors)
          setError('Please fix the errors below')
        } else {
          setError(result.error)
        }

        setLoading(false)
        return
      }

      router.push('/books')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyles =
    'w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:placeholder:text-zinc-400'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Share a book
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            List a book from your collection for others to read
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-950 rounded-lg shadow p-8"
        >
          {/* Title */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Book Title *
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., Atomic Habits"
              required
              className={inputStyles}
            />

            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.title[0]}
              </p>
            )}
          </div>

          {/* Author */}
          <div className="mb-6">
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Author *
            </label>

            <input
              id="author"
              name="author"
              type="text"
              placeholder="e.g., James Clear"
              required
              className={inputStyles}
            />

            {fieldErrors.author && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.author[0]}
              </p>
            )}
          </div>

          {/* Condition */}
          <div className="mb-6">
            <label
              htmlFor="condition"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Condition *
            </label>

            <select
              id="condition"
              name="condition"
              required
              className={inputStyles}
              defaultValue=""
            >
              <option value="">Select condition</option>

              <option value="LIKE_NEW">
                Like new - pristine condition
              </option>

              <option value="GOOD">
                Good - minor wear
              </option>

              <option value="WORN">
                Worn - significant wear
              </option>
            </select>

            {fieldErrors.condition && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.condition[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Tell others about this book..."
              rows={4}
              className={`${inputStyles} resize-none`}
            />

            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* City + State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                City *
              </label>

              <input
                id="city"
                name="city"
                type="text"
                placeholder="e.g., Delhi"
                required
                className={inputStyles}
              />

              {fieldErrors.city && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.city[0]}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                State *
              </label>

              <input
                id="state"
                name="state"
                type="text"
                placeholder="e.g., Delhi"
                required
                className={inputStyles}
              />

              {fieldErrors.state && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.state[0]}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sharing book...' : 'Share book'}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            * Required fields
          </p>
        </form>
      </div>
    </div>
  )
}