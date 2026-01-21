import prisma from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import OnboardingForm from "../_components/onboardingForm"
import Link from "next/link"

export default async function OnboardingPage() {
  const { userId } = await auth()

  // Si non connecté → rediriger
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    // 1. Vérifier si l'utilisateur existe dans la base de données
    let dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    // 2. Si l'utilisateur n'existe pas, le créer
    if (!dbUser) {
      const clerkUser = await currentUser()
      
      if (!clerkUser) {
        redirect('/sign-in')
      }

      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      
      dbUser = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          name: fullName || null,
          image: clerkUser.imageUrl || null,
        }
      })
      
      console.log('✅ Utilisateur créé:', dbUser.email)
    }

    // 3. Vérifier si l'utilisateur a déjà une company
    if (dbUser.companyId) {
      return redirect('/dashboard')
    }

    // 4. Afficher le formulaire d'onboarding
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <OnboardingForm 
          userId={dbUser.id}
          userEmail={dbUser.email}
          userName={dbUser.name || undefined}
        />
      </div>
    )

  } catch (error) {
    console.error('❌ Erreur OnboardingPage:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Entreprise déjà enregistrée</h1>
          <p className="text-gray-600">Aller au tableau de bord</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Link href={"/dashboard"}>
              Tableau de Bord
            </Link>
          </button>
        </div>
      </div>
    )
  }
}