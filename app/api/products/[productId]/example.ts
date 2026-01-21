// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET - Récupérer un produit spécifique
export async function GET(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Aucune société associée' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId, // Vérifier que le produit appartient à la company de l'utilisateur
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un produit
export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price } = body;

    // Validation des données
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre positif' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Aucune société associée' },
        { status: 400 }
      );
    }

    // Vérifier que le produit existe et appartient à la company de l'utilisateur
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé ou accès non autorisé' },
        { status: 404 }
      );
    }

    // Mettre à jour le produit
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un produit avec ce nom existe déjà pour votre société' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un produit
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: 'Aucune société associée' },
        { status: 400 }
      );
    }

    // Vérifier que le produit existe et appartient à la company de l'utilisateur
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé ou accès non autorisé' },
        { status: 404 }
      );
    }

    // Vérifier si le produit est utilisé dans des factures
    if (existingProduct._count.invoiceItems > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce produit car il est utilisé dans des factures',
          details: `Ce produit est utilisé dans ${existingProduct._count.invoiceItems} facture(s)`
        },
        { status: 400 }
      );
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}