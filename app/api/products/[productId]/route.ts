// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/products/[id] - Récupérer un produit spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`=== GET /api/products/${params.id} called ===`);
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        companyId, // Assure que le produit appartient à l'entreprise
      },
      include: {
        _count: {
          select: {
            invoiceItems: true,
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ 
        success: false,
        error: 'Produit non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      data: product,
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Mettre à jour un produit
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`=== PUT /api/products/${params.id} called ===`);
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;
    const data = await request.json();
    console.log('Update data:', data);

    // Vérifier que le produit existe et appartient à l'entreprise
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: params.id,
        companyId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ 
        success: false,
        error: 'Produit non trouvé' 
      }, { status: 404 });
    }

    // Validation des données
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le nom du produit est obligatoire' 
        },
        { status: 400 }
      );
    }

    if (data.price === undefined || data.price === null) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le prix du produit est obligatoire' 
        },
        { status: 400 }
      );
    }

    const priceValue = parseFloat(data.price);
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le prix doit être un nombre positif' 
        },
        { status: 400 }
      );
    }

    // Vérifier si un autre produit a déjà ce nom dans la même entreprise
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        companyId,
        name: data.name.trim(),
        id: { not: params.id }, // Exclure le produit actuel
      },
    });

    if (duplicateProduct) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un autre produit avec ce nom existe déjà dans votre catalogue' 
        },
        { status: 409 }
      );
    }

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: {
        id: params.id,
        companyId,
      },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: priceValue,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Product updated:', product.id);

    return NextResponse.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: product,
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un produit avec ces informations existe déjà' 
        },
        { status: 409 }
      );
    }

    // Gérer les erreurs de validation Prisma
    if (error instanceof Error && error.message.includes('Invalid value')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Les données fournies sont invalides' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Supprimer un produit
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`=== DELETE /api/products/${params.id} called ===`);
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;

    // Vérifier que le produit existe et appartient à l'entreprise
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        companyId,
      },
      include: {
        _count: {
          select: {
            invoiceItems: true,
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ 
        success: false,
        error: 'Produit non trouvé' 
      }, { status: 404 });
    }

    // Vérifier si le produit est utilisé dans des factures
    if (product._count.invoiceItems > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Ce produit est utilisé dans des factures et ne peut pas être supprimé',
          usageCount: product._count.invoiceItems
        },
        { status: 400 }
      );
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: {
        id: params.id,
        companyId,
      },
    });

    console.log('Product deleted:', params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Produit supprimé avec succès',
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Gérer les erreurs de contrainte de clé étrangère
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Ce produit est utilisé dans des factures et ne peut pas être supprimé' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}