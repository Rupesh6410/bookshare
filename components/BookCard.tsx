"use client"

import { deleteBook } from "@/app/actions/book"
import Link from "next/link"

export default function BookCard({ book }: { book: any }) {

  return (
    <div className="border p-4 rounded-lg flex justify-between items-center">

      {/* LEFT SIDE */}
      <div>
        <h2 className="font-bold text-lg">
          {book.title}
        </h2>

        <p className="text-sm text-gray-600">
          {book.author}
        </p>

        <p className="text-sm text-gray-400">
          {book.description}
        </p>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex gap-2">

        {/* EDIT */}
        <Link href={`/books/edit/${book.id}`}>
          <button className="bg-yellow-500 text-white px-3 py-1 rounded">
            Edit
          </button>
        </Link>

        {/* DELETE */}
        <form action={deleteBook}>
          <input type="hidden" name="id" value={book.id} />

          <button className="bg-red-500 text-white px-3 py-1 rounded">
            Delete
          </button>
        </form>

      </div>

    </div>
  )
}