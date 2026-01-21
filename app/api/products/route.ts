// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const companyId = searchParams.get('companyId');

    const skip = (page - 1) * limit;

    // Vérifier que l'utilisateur a accès à cette company
    let userCompanyId = companyId;
    
    if (!companyId) {
      // Récupérer la company de l'utilisateur
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
      
      userCompanyId = user.companyId;
    } else {
      // Vérifier que l'utilisateur a accès à cette company
      const user = await prisma.user.findFirst({
        where: {
          clerkUserId: userId,
          companyId: companyId
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        );
      }
    }

    // Construire les conditions de recherche
    const where: any = {
      companyId: userCompanyId,
      ...(search && {
        OR: [
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
        ],
      }),
    };

    // Récupérer les produits avec pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      select: { 
        id: true,
        companyId: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une société pour créer un produit' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette company
    // (optionnel : si companyId est fourni, vérifier qu'elle correspond à celle de l'utilisateur)
    if (companyId && companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette société' },
        { status: 403 }
      );
    }

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price,
        companyId: user.companyId, // Toujours utiliser la company de l'utilisateur
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

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Gestion des erreurs spécifiques
    if (error.code === 'P2002') {
      // Erreur de contrainte unique (si vous avez des contraintes)
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