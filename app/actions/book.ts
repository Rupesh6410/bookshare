"use server"
import { checkUser } from "@/lib/checkUser"
import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"


export const createBook = async (formData: FormData) => {
    const userId = await checkUser();
    if (!userId) return;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;

    const book = await prisma.book.create({
        data:{
            title,
            author,
            description,
            image,
            userId
        }
    })
    
    revalidatePath("/books");
}

    export const deleteBook = async (formData: FormData)=>{
        const userId = await checkUser();
        if (!userId) return;
        const id = formData.get("id") as string;
        await prisma.book.delete({
            where:{
                id,
                userId
            }
        })
        revalidatePath("/books");
    }

    export const updateBook = async (formData: FormData)=>{
        const userId = await checkUser();
        if (!userId) return;
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const author = formData.get("author") as string;
        const description = formData.get("description") as string;
        const image = formData.get("image") as string;
        await prisma.book.update({
            where:{
                id,
                userId
            },
            data:{
                title,
                author,
                description,
                image
            }
        })
        revalidatePath("/books");
    }

    