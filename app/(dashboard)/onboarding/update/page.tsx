import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CompanySettingsForm from "../../_components/onboardingSettingForm";

export default async function CompanySettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          companyEmail: true,
          phone: true,
          address: true,
          currency: true,
          language: true,
          logo: true,
        },
      },
    },
  });

  if (!user?.company) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres de l'entreprise</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les informations de votre entreprise
        </p>
      </div>

      <CompanySettingsForm company={user.company} />
    </div>
  );
}
