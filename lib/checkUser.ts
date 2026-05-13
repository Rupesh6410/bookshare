import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export const checkUser = async () => {
  const user = await currentUser()
  
  if (!user) return null

  const userId = user.id
  const email = user.emailAddresses[0].emailAddress
  const name = user.fullName

  // Check if user already exists
  const checkExistingUser = await prisma.user.findUnique({
    where: {
      clerkId: userId  // ✅ FIXED
    }
  })

  // If doesn't exist, create new user
  if (!checkExistingUser) {
    await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        name: name || ""
      }
    })
  }

  return user.id
}



