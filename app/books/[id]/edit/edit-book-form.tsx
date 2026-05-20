'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { updateBook } from '@/app/actions/book'
import { UploadButton, UploadDropzone } from '@/utils/uplaodthing'
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
  description?: string
  photos: string[]
  city: string
  state: string
}

interface EditBookFormProps {
  initialBook: Book
}

export default function EditBookForm({ initialBook }: EditBookFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [photos, setPhotos] = useState<string[]>(initialBook.photos)
  const [showDeletePhoto, setShowDeletePhoto] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: initialBook.title,
    author: initialBook.author,
    condition: initialBook.condition,
    description: initialBook.description || '',
    city: initialBook.city,
    state: initialBook.state,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function openDeletePhotoDialog(idx: number) {
    setPhotoToDelete(idx)
    setShowDeletePhoto(true)
  }

  function handleConfirmDeletePhoto() {
    if (photoToDelete !== null) {
      setPhotos(photos.filter((_, i) => i !== photoToDelete))
      setShowDeletePhoto(false)
      setPhotoToDelete(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    const data = {
      title: formData.title,
      author: formData.author,
      condition: formData.condition,
      description: formData.description,
      city: formData.city,
      state: formData.state,
      photos: photos.length > 0 ? photos : [],
    }

    const result = await updateBook(initialBook.id, data)

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
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit book
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your book details
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Book Cover Photos
            </label>

            {photos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
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
                        onClick={() => openDeletePhotoDialog(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add more photos button */}
                {photos.length < 4 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <UploadDropzone
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
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
              value={formData.author}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="LIKE_NEW">Like new - pristine condition</option>
              <option value="GOOD">Good - minor wear</option>
              <option value="WORN">Worn - significant wear</option>
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
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
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
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              {fieldErrors.state && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.state[0]}
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black font-medium py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </Link>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            * Required fields
          </p>
        </form>
      </div>

      {/* Delete photo confirmation dialog */}
      <AlertDialog open={showDeletePhoto} onOpenChange={setShowDeletePhoto}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Remove photo?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This photo will be removed from your book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePhoto}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}