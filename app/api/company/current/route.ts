// app/api/company/current/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Trouver l'utilisateur dans notre base de données
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a une company
    if (!dbUser.company) {
      // Si pas de company, on peut en créer une par défaut
      // ou retourner null selon votre logique métier
      return NextResponse.json({ company: null });
    }

    // Retourner les infos de la company
    const company = {
      id: dbUser.company.id,
      companyName: dbUser.company.companyName,
      companyEmail: dbUser.company.companyEmail,
      logo: dbUser.company.logo,
      currency: dbUser.company.currency,
      language: dbUser.company.language,
      address: dbUser.company.address,
      phone: dbUser.company.phone
    };

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}