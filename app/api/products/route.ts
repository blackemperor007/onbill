// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/products - Récupérer tous les produits
export async function GET(request: Request) {
  console.log('=== GET /api/products called ===');
  
  try {
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    console.log('Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    console.log('User found:', !!user);
    console.log('Company found:', !!user?.company);

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;
    console.log('Company ID:', companyId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    console.log('Search query:', search);

    // Construire les conditions de recherche
    const where: any = { companyId };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    console.log('Fetching products from database...');
    // Récupérer les produits avec le compte des factures où ils sont utilisés
    const products = await prisma.product.findMany({
      where,
      include: {
        _count: {
          select: {
            invoiceItems: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${products.length} products`);

    return NextResponse.json({ 
      success: true,
      data: products,
      total: products.length,
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development'
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Créer un nouveau produit
export async function POST(request: Request) {
  console.log('=== POST /api/products called ===');
  
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
    console.log('Product data:', data);

    // Validation des données selon le schéma Prisma
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le nom du produit est obligatoire' 
        },
        { status: 400 }
      );
    }

    // Validation du prix
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

    // Optionnel : Vérifier si un produit avec le même nom existe déjà dans la même entreprise
    const existingProduct = await prisma.product.findFirst({
      where: {
        companyId,
        name: data.name.trim(),
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un produit avec ce nom existe déjà dans votre catalogue' 
        },
        { status: 409 }
      );
    }

    // Créer le produit selon le schéma
    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: priceValue,
        companyId,
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

    console.log('Product created:', product.id);

    return NextResponse.json({
      success: true,
      message: 'Produit créé avec succès',
      data: product,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
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

// DELETE /api/products/bulk - Suppression multiple
export async function DELETE(request: Request) {
  console.log('=== DELETE /api/products/bulk called ===');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    const { productIds } = await request.json();
    console.log('Product IDs to delete:', productIds);

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Liste de produits invalide' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à ces produits
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

    // Vérifier que tous les produits appartiennent à cette company
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
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

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Accès non autorisé à certains produits' 
        },
        { status: 403 }
      );
    }

    // Vérifier si certains produits sont utilisés dans des factures
    const usedProducts = products.filter(p => p._count.invoiceItems > 0);
    if (usedProducts.length > 0) {
      const productNames = usedProducts.map(p => p.name).join(', ');
      return NextResponse.json(
        { 
          success: false,
          error: `Les produits suivants sont utilisés dans des factures et ne peuvent pas être supprimés : ${productNames}`,
          usedProducts: usedProducts.map(p => ({ id: p.id, name: p.name }))
        },
        { status: 400 }
      );
    }

    // Supprimer les produits
    await prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        companyId,
      },
    });

    console.log(`Deleted ${productIds.length} products`);

    return NextResponse.json({ 
      success: true, 
      message: `${productIds.length} produit(s) supprimé(s) avec succès` 
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}