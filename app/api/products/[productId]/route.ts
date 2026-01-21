import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à ce produit
    const user = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
        companyId: product.companyId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, companyId } = body;

    // Vérifier que l'utilisateur a accès à cette company
    const user = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
        companyId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que le produit existe et appartient à la company
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer le produit pour vérifier la company
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { companyId: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette company
    const user = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
        companyId: product.companyId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}