"use server"
import { checkUser } from "@/lib/checkUser"
import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"
import { bookSchema } from "@/lib/validations"
import { AppError } from "@/lib/app-error"

// create a book
export const createBook = async (data:unknown) => {

  try {
      const result = bookSchema.safeParse(data);
      if (!result.success) {
          throw new AppError("Validation failed", 400, result.error.flatten().fieldErrors);
      }
      const clerkId = await checkUser();
      if (!clerkId){
          throw new AppError("User not found", 404);
      };
  
      const user=prisma.user.findUnique({
          where: {
              clerkId
          }
      })
      if (!user){
          throw new AppError("User not found", 404);
      };
  
      const book = await prisma.book.create({
          data: {
              ...result.data,
              ownerId: user.id
          }
      })
      revalidatePath("/books")
      return {success:true , book}
  
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Internal server error", 500);
    
  }

}

// update a book

const updateBook = async (id:string, data:unknown) => {
    try {
        const clerkId = await checkUser();
        if (!clerkId){
            throw new AppError("User not found", 404);
        };

        const result = bookSchema.safeParse(data);
        if (!result.success) {
            throw new AppError("Validation failed", 400, result.error.flatten().fieldErrors);
        }
        const user=await prisma.user.findUnique({
            where: {
                clerkId
            }
        })
        
        if (!user){
            throw new AppError("User not found", 404);
        }
        const book=await prisma.book.findUnique({
            where: {
                id
            }
        })
        if (!book){
            throw new AppError("Book not found", 404);
        }
        if(book.ownerId !== user.id){
            throw new AppError("You can only update your own book", 403);
        }
        const updated= prisma.book.update({
            where: {
                id
            },
            data: {
                ...result.data
            }
        })
        revalidatePath("/books")
        return {success:true , book:updated}


    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError("Internal server error", 500);
    }
    
}

// delete a book
const deleteBook= async(id:string)=>{
    try {
        const clerkId = await checkUser();
        if (!clerkId){
            throw new AppError("User not found", 404);
        };
        const user=await prisma.user.findUnique({
            where: {
                clerkId
            }
        })
        if (!user){
            throw new AppError("User not found", 404);
        }

        const book=await prisma.book.findUnique({
            where: {
                id
            }
        })
        if (!book){
            throw new AppError("Book not found", 404);
        }
        if(book.ownerId !== user.id){
            throw new AppError("You can only delete your own book", 403);
        }
        const deleted= prisma.book.delete({
            where: {
                id
            }
        })
        revalidatePath("/books")
        return {success:true}
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError("Internal server error", 500);
    }
}
    