import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();
  if (user){
    const userId = user.id;
    const email = user.emailAddresses[0].emailAddress
    const name = user.fullName
    const checkExistingUser = await prisma.user.findUnique({
      where: {
        userId: userId
      }
    })
    if (!checkExistingUser){
        // creatting a new User
        await prisma.user.create({
            data:{
                userId: userId,
                email: email,
                name: name||""
            }
        })
    }
    return user.id
  }
  if(!user){
    return null
  }

}



