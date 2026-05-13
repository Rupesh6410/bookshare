import {prisma} from "../../lib/prisma";
import {checkUser} from "../../lib/checkUser";
import BookCard from "../../components/BookCard";
import Link from "next/link";


export default async function BooksPage({searchParams}: {searchParams: any}){
    const userId = await checkUser();
    if (!userId) return null;
    const page= await Number(searchParams?.page) || 1;
    const limit=10;
    const skip=(page-1)*limit;
    
    const books = await prisma.book.findMany({
        where: {
            userId: userId
        },
        skip:skip,
        take: limit,
        orderBy: {
            createdAt: "desc"
        }
    })
    return(
        <div className="p-6">
            <h1 className="text-2xl font-bold">My Books</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.length==0 ? <p>No books found</p> : books.map((book: any) => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>

            <div>{
                books.length > 0 && (
                    <div>
                        <Link href={`/books?page=${page+1}`}>Next</Link>
                    </div>
                )
            }</div>

            <div className="flex justify-center gap-4 mt-10">
        {page > 1 && (
          <Link href={`/books?page=${page - 1}`}>
            <button className="px-4 py-2 border rounded">
              Previous
            </button>
          </Link>
        )}

        {books.length === limit && (
          <Link href={`/books?page=${page + 1}`}>
            <button className="px-4 py-2 border rounded">
              Next
            </button>
          </Link>
        )}
      </div>

      {/* ADD BUTTON */}
      <div className="mt-10 flex justify-center">
        <Link href="/books/new">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-full">
            + Add New Book
          </button>
        </Link>
      </div>
        
        </div>

    )



}


