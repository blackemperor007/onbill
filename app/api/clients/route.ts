// app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  console.log('=== GET /api/clients called ===');
  
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
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          address: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    console.log('Fetching clients from database...');
    // Récupérer les clients avec le compte des factures
    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            invoices: true,
            payments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${clients.length} clients`);

    return NextResponse.json({ 
      success: true,
      data: clients,
      total: clients.length,
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
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



// Pour la suppression en masse
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { clientIds } = await request.json();

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste de clients invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à ces clients
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Aucune entreprise trouvée' }, { status: 404 });
    }

    // Vérifier que tous les clients appartiennent à cette company
    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
        companyId: user.company.id,
      },
    });

    if (clients.length !== clientIds.length) {
      return NextResponse.json(
        { error: 'Accès non autorisé à certains clients' },
        { status: 403 }
      );
    }

    // Supprimer les clients
    await prisma.client.deleteMany({
      where: {
        id: { in: clientIds },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${clientIds.length} client(s) supprimé(s)` 
    });
  } catch (error) {
    console.error('Error bulk deleting clients:', error);
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

    // Validation des données selon le schéma Prisma
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le nom du client est obligatoire' 
        },
        { status: 400 }
      );
    }

    // Optionnel : Vérifier si un client avec le même email existe déjà
    if (data.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          companyId,
          email: data.email,
        },
      });

      if (existingClient) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Un client avec cet email existe déjà dans votre base' 
          },
          { status: 409 }
        );
      }
    }

    // Créer le client selon le schéma
    const client = await prisma.client.create({
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client créé avec succès',
      data: client,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un client avec ces informations existe déjà' 
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