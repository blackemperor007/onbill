import { addUserToDatabase, getUserFromDatabase } from "@/services/userServices";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await currentUser();

  // Ajoutez l'utilisateur à la base de données
  if (userId && user) {
    const fullName = user.firstName + ' ' + user.lastName || '';
    const email = user.emailAddresses[0]?.emailAddress || '';
    const image = user.imageUrl || '';
    await addUserToDatabase(userId, fullName, email, image);
  }

  const data = await getUserFromDatabase(userId)
    return (
        <>
        <main>
            <div>
                Onboarding Page
            </div>
        </main>
        </>
    )
}