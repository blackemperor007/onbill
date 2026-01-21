import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";


export const addUserToDatabase = async (clerkUserId: string, name: string, email: string, image: string) => {
  try {
    const user = await prisma.user.upsert({
      where: { clerkUserId },
      update: {
        name,
        email,
        image
      },
      create: {
        clerkUserId,
        name,
        email,
        image
      },
    });
    return user;
  } catch (error) {
    console.error("Error adding user to database:", error);
    throw error;
  }
};



export const getUserFromDatabase = async (clerkUserId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur de la base de données:", error);
    throw error;
  }
};

export async function syncUserWithClerk() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return null
    }

    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    const image = clerkUser.imageUrl || ''

    // Upsert: créer ou mettre à jour l'utilisateur
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {
        email,
        name: fullName || null,
        image: image || null,
      },
      create: {
        clerkUserId: userId,
        email,
        name: fullName || null,
        image: image || null,
      },
    })

    return user
  } catch (error) {
    console.error("Erreur syncUserWithClerk:", error)
    return null
  }
}

export async function checkUserHasCompany(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { companyId: true }
    })
    
    return !!user?.companyId
  } catch (error) {
    console.error("Erreur checkUserHasCompany:", error)
    return false
  }
}