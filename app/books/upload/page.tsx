'use client'

import { createBook } from '@/app/actions/book'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadButton, UploadDropzone } from '../../../utils/uplaodthing'
import Image from 'next/image'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [photos, setPhotos] = useState<string[]>([])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      photos: photos.length > 0 ? photos : []
    }

    const result = await createBook(data)

    if ('error' in result) {
      setLoading(false)

      if ('fieldErrors' in result) {
        setFieldErrors(result.fieldErrors)
        setError('Please fix the errors below')
      } else {
        setError(result.error)
      }
      return
    }

    setLoading(false)
    router.push('/books')
  }

  const inputStyles =
    'w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white'

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

        {/* General error message */}
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
          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Book Cover Photo
            </label>

            {photos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-6">
                <UploadDropzone
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res) {
                      const urls = res.map((file) => file.url)
                      setPhotos(urls)
                      setError(null)
                    }
                  }}
                  onUploadError={(error: Error) => {
                    setError(`Upload failed: ${error.message}`)
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Photo preview grid */}
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <Image
                        src={photo}
                        alt={`Book cover ${idx + 1}`}
                        width={200}
                        height={300}
                        className="w-full h-64 object-cover rounded-lg"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPhotos(
                            photos.filter((_, i) => i !== idx)
                          )
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add more photos button */}
                {photos.length < 4 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-6">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res) {
                          const urls = res.map((file) => file.url)
                          setPhotos([...photos, ...urls])
                        }
                      }}
                      onUploadError={(error: Error) => {
                        setError(`Upload failed: ${error.message}`)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title field */}
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

          {/* Author field */}
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

          {/* Condition field */}
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

          {/* Description field */}
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
              placeholder="Tell others about this book... (optional)"
              rows={4}
              className={`${inputStyles} resize-none`}
            />

            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* City field */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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

            {/* State field */}
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-3 rounded-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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