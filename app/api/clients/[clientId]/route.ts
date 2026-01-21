// app/api/clients/[clientId]/route.ts (méthode GET)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
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
    const clientId = params.clientId;

    // Récupérer le client avec ses statistiques
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            payments: true,
          }
        },
        invoices: {
          select: {
            issueDate: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Formater la réponse
    const formattedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      _count: client._count,
      lastInvoiceDate: client.invoices[0]?.issueDate || null,
    };

    return NextResponse.json({
      success: true,
      data: formattedClient,
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { clientId: string } }
) {
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
    const clientId = params.clientId;
    const data = await request.json();

    // Validation des données
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le nom du client est obligatoire' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le client existe et appartient à la company
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre client
    if (data.email && data.email !== existingClient.email) {
      const clientWithSameEmail = await prisma.client.findFirst({
        where: {
          companyId,
          email: data.email,
          NOT: {
            id: clientId,
          },
        },
      });

      if (clientWithSameEmail) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Un autre client utilise déjà cet email' 
          },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: updatedClient,
    });

  } catch (error) {
    console.error('Error updating client:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un client avec ces informations existe déjà' 
        },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé' 
        },
        { status: 404 }
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