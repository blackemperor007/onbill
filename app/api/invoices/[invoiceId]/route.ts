// app/api/invoices/[invoiceId]/route.ts (méthode DELETE)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Une erreur inconnue est survenue';
}

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

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { error: 'Aucune société associée' },
        { status: 400 }
      );
    }

    // Récupérer la facture avec toutes les relations
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.company.id, // Vérifier l'appartenance
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            companyEmail: true,
            address: true,
            phone: true,
            logo: true,
            currency: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            reference: true,
          },
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    
    console.log('Deleting invoice with ID:', invoiceId);
    
    if (!invoiceId || invoiceId.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID de facture invalide ou manquant' 
        },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur avec sa company
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

    // Vérifier l'existence et les permissions
    const invoiceExists = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: user.company.id,
      },
      select: { id: true }
    });

    if (!invoiceExists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Facture non trouvée ou non autorisée' 
        },
        { status: 404 }
      );
    }

    // Utiliser une transaction
    await prisma.$transaction(async (tx) => {
      await tx.invoice.delete({
        where: { id: invoiceId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Facture supprimée avec succès',
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Facture non trouvée' 
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' 
          ? getErrorMessage(error) 
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const body = await request.json();
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur avec sa company
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

    // Vérifier que la facture existe et appartient à la company
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: user.company.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Facture non trouvée ou non autorisée' 
        },
        { status: 404 }
      );
    }

    // Mettre à jour la facture avec transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Supprimer les anciens items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId },
      });

      // Créer les nouveaux items
      const items = body.items || [];
      for (const item of items) {
        await tx.invoiceItem.create({
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal: item.quantity * item.unitPrice,
            taxAmount: (item.quantity * item.unitPrice * item.taxRate) / 100,
            total: (item.quantity * item.unitPrice) + ((item.quantity * item.unitPrice * item.taxRate) / 100),
            invoiceId,
            productId: item.productId,
          },
        });
      }

      // Mettre à jour la facture
      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          clientId: body.clientId,
          status: body.status,
          issueDate: new Date(body.issueDate),
          dueDate: new Date(body.dueDate),
          paymentMethod: body.paymentMethod,
          notes: body.notes,
          terms: body.terms,
          subtotal: body.subtotal,
          taxAmount: body.taxAmount,
          total: body.total,
          amountDue: body.amountDue,
        },
        include: {
          items: true,
          client: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Facture mise à jour avec succès',
      invoice: updatedInvoice,
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la mise à jour de la facture',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 }
    );
  }
}