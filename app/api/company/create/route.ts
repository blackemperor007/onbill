// app/api/company/create/route.ts
import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const userId = formData.get("userId") as string
    const companyName = formData.get("companyName") as string
    const companyEmail = formData.get("companyEmail") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const currency = formData.get("currency") as string
    const language = formData.get("language") as string
    const logoFile = formData.get("logo") as File | null

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur non identifié" },
        { status: 400 }
      )
    }

    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est obligatoire" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà une company
    if (user.companyId) {
      return NextResponse.json(
        { error: "Cet utilisateur a déjà une entreprise" },
        { status: 400 }
      )
    }

    let logoUrl: string | null = null

    // Gérer l'upload du logo si présent
    if (logoFile && logoFile.size > 0) {
      try {
        const bytes = await logoFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Générer un nom de fichier unique avec crypto.randomUUID()
        const fileExtension = logoFile.name.split('.').pop() || 'png'
        const fileName = `logo_${crypto.randomUUID()}.${fileExtension}`
        
        // Chemin pour le stockage
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
        const filePath = path.join(uploadDir, fileName)
        
        // Créer le dossier s'il n'existe pas
        const fs = await import('fs')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        
        // Écrire le fichier
        await writeFile(filePath, buffer)
        
        // URL accessible publiquement
        logoUrl = `/uploads/logos/${fileName}`
        
      } catch (uploadError) {
        console.error("Erreur upload logo:", uploadError)
        // Continuer sans logo si l'upload échoue
      }
    }

    // Créer la company
    const company = await prisma.company.create({
      data: {
        companyName: companyName.trim(),
        companyEmail: companyEmail?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        currency: currency || "EUR",
        language: language || "fr",
        logo: logoUrl
      }
    })

    // Lier l'utilisateur à la company
    await prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id }
    })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.companyName,
        email: company.companyEmail,
        logo: company.logo
      }
    })

  } catch (error: any) {
    console.error("Erreur création company:", error)
    
    // Gérer les contraintes d'unicité
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Une entreprise avec ce nom ou cet email existe déjà" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'entreprise" },
      { status: 500 }
    )
  }
}