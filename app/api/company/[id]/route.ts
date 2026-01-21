import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur possède cette company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { companyId: true }
    })

    if (!user || user.companyId !== params.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyName, companyEmail, phone, address, currency, language } = body

    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est obligatoire" },
        { status: 400 }
      )
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        companyName: companyName.trim(),
        companyEmail: companyEmail?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        currency: currency || "EUR",
        language: language || "fr",
      }
    })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.companyName,
        email: company.companyEmail,
      }
    })

  } catch (error: any) {
    console.error("Erreur mise à jour company:", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Une entreprise avec ce nom ou cet email existe déjà" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    )
  }
}