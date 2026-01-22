// app/api/invoices/[id]/pdf/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadImage } from '@/lib/image-loader';

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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.company.id,
      },
      include: {
        company: true,
        client: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true,
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Créer le PDF en format A4
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 20;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    
    // Couleurs professionnelles
    const PRIMARY_COLOR = '#1e293b'; // Bleu foncé
    const SECONDARY_COLOR = '#3b82f6'; // Bleu
    const LIGHT_GRAY = '#f1f5f9';
    const DARK_GRAY = '#64748b';
    const SUCCESS_COLOR = '#10b981';
    const WARNING_COLOR = '#f59e0b';
    const DANGER_COLOR = '#ef4444';

    // Fonction pour obtenir la couleur du statut
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PAID': return SUCCESS_COLOR;
        case 'PENDING': return WARNING_COLOR;
        case 'OVERDUE': return DANGER_COLOR;
        default: return DARK_GRAY;
      }
    };

    // Fonction pour formater la date
    const formatDate = (date: Date) => {
      return format(date, 'dd/MM/yyyy', { locale: fr });
    };

    // Fonction pour formatter la devise
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: invoice.company.currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Fonction pour obtenir le texte du statut
    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        'PENDING': 'EN ATTENTE',
        'PAID': 'PAYÉE',
        'OVERDUE': 'EN RETARD',
        'CANCELLED': 'ANNULÉE',
        'DRAFT': 'BROUILLON'
      };
      return statusMap[status] || status;
    };

    let yPos = MARGIN;

    // ===== EN-TÊTE AVEC LOGOS =====
    // Logo de l'entreprise (en haut à gauche)
    if (invoice.company.logo) {
      try {
        const logoData = await loadImage(invoice.company.logo);
        doc.addImage(logoData, 'PNG', MARGIN, yPos, 40, 15);
      } catch (error) {
        console.error('Erreur chargement logo:', error);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(invoice.company.companyName || 'VOTRE ENTREPRISE', MARGIN, yPos + 10);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(PRIMARY_COLOR);
      doc.text(invoice.company.companyName || 'VOTRE ENTREPRISE', MARGIN, yPos + 10);
    }

    // Titre FACTURE en haut à droite
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('FACTURE', PAGE_WIDTH - MARGIN, yPos + 10, { align: 'right' });

    // Numéro de facture sous le titre
    doc.setFontSize(14);
    doc.setTextColor(SECONDARY_COLOR);
    doc.text(`#${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN, yPos + 18, { align: 'right' });

    yPos += 30;

    // ===== INFORMATIONS DE L'ENTREPRISE =====
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DARK_GRAY);
    
    if (invoice.company.address) {
      doc.text(`Adresse: ${invoice.company.address}`, MARGIN, yPos);
    }
    if (invoice.company.phone) {
      doc.text(`Téléphone: ${invoice.company.phone}`, MARGIN, yPos + 6);
    }
    if (invoice.company.companyEmail) {
      doc.text(`Email: ${invoice.company.companyEmail}`, MARGIN, yPos + 12);
    }

    yPos += 25;

    // ===== BLOC INFORMATIONS FACTURE =====
    const infoBoxY = yPos;
    
    // Dates
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('DATE DE FACTURATION:', PAGE_WIDTH - MARGIN - 70, infoBoxY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(new Date(invoice.issueDate)), PAGE_WIDTH - MARGIN, infoBoxY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('DATE D\'ÉCHÉANCE:', PAGE_WIDTH - MARGIN - 70, infoBoxY + 7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    const dueDate = formatDate(new Date(invoice.dueDate));
    doc.text(dueDate, PAGE_WIDTH - MARGIN, infoBoxY + 7, { align: 'right' });

    // Statut avec couleur
    const statusText = getStatusText(invoice.status);
    const statusColor = getStatusColor(invoice.status);
    
    doc.setFont('helvetica', 'bold');
    doc.text('STATUT:', PAGE_WIDTH - MARGIN - 70, infoBoxY + 14, { align: 'right' });
    doc.setTextColor(statusColor);
    doc.text(statusText, PAGE_WIDTH - MARGIN, infoBoxY + 14, { align: 'right' });

    // Méthode de paiement
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉTHODE DE PAIEMENT:', PAGE_WIDTH - MARGIN - 70, infoBoxY + 21, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.paymentMethod, PAGE_WIDTH - MARGIN, infoBoxY + 21, { align: 'right' });

    yPos += 25;

    // ===== INFORMATIONS DU CLIENT =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('FACTURÉ À:', MARGIN, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(invoice.client.name.toUpperCase(), MARGIN, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(DARK_GRAY);
    
    let clientInfoY = yPos + 15;
    if (invoice.client.address) {
      doc.text(invoice.client.address, MARGIN, clientInfoY);
      clientInfoY += 6;
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, MARGIN, clientInfoY);
      clientInfoY += 6;
    }
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, MARGIN, clientInfoY);
    }

    yPos = Math.max(yPos + 35, clientInfoY + 10);

    // ===== TABLEAU DES ARTICLES =====
    // En-tête du tableau
    doc.setFillColor(LIGHT_GRAY);
    doc.rect(MARGIN, yPos, CONTENT_WIDTH, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PRIMARY_COLOR);
    
    const col1 = MARGIN + 5;
    const col2 = MARGIN + 120;
    const col3 = MARGIN + 150;
    const col4 = MARGIN + 170;
    const col5 = PAGE_WIDTH - MARGIN - 5;
    
    doc.text('DESCRIPTION', col1, yPos + 7);
    doc.text('QUANTITÉ', col2, yPos + 7);
    doc.text('PRIX UNITAIRE', col3, yPos + 7);
    doc.text('TVA', col4, yPos + 7);
    doc.text('TOTAL', col5, yPos + 7, { align: 'right' });

    yPos += 15;

    // Lignes des articles
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    
    invoice.items.forEach((item, index) => {
      // Alternance de couleur de fond
      if (index % 2 === 0) {
        doc.setFillColor('#ffffff');
      } else {
        doc.setFillColor(LIGHT_GRAY);
      }
      doc.rect(MARGIN, yPos, CONTENT_WIDTH, 10, 'F');
      
      // Description
      doc.text(item.description.substring(0, 40), col1, yPos + 7);
      
      // Quantité
      doc.text(item.quantity.toString(), col2, yPos + 7, { align: 'center' });
      
      // Prix unitaire
      doc.text(formatCurrency(item.unitPrice), col3, yPos + 7, { align: 'center' });
      
      // TVA
      doc.text(`${item.taxRate}%`, col4, yPos + 7, { align: 'center' });
      
      // Total
      doc.text(formatCurrency(item.total), col5, yPos + 7, { align: 'right' });
      
      yPos += 10;
    });

    yPos += 15;

    // ===== SOUS-TOTAL ET TOTAL =====
    const totalsStartY = yPos;
    
    // Ligne de séparation
    doc.setDrawColor(DARK_GRAY);
    doc.setLineWidth(0.5);
    doc.line(MARGIN + 120, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos += 10;

    // Sous-total HT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(DARK_GRAY);
    doc.text('Sous-total HT:', MARGIN + 120, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(invoice.subtotal), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 7;

    // Montant TVA
    doc.setFont('helvetica', 'normal');
    doc.text('TVA:', MARGIN + 120, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(invoice.taxAmount), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 10;

    // Ligne épaisse pour le total
    doc.setDrawColor(PRIMARY_COLOR);
    doc.setLineWidth(1);
    doc.line(MARGIN + 120, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos += 10;

    // Total TTC
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('TOTAL TTC:', MARGIN + 120, yPos);
    doc.setFontSize(16);
    doc.text(formatCurrency(invoice.total), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 15;

    // ===== MONTANTS PAYÉS ET RESTANT =====
    if (invoice.amountPaid > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(DARK_GRAY);
      
      // Montant déjà payé
      doc.text('Montant payé:', MARGIN + 120, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(SUCCESS_COLOR);
      doc.text(formatCurrency(invoice.amountPaid), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
      yPos += 7;

      // Reste à payer
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(DARK_GRAY);
      doc.text('Reste à payer:', MARGIN + 120, yPos);
      doc.setFont('helvetica', 'bold');
      
      const restColor = invoice.status === 'PAID' ? SUCCESS_COLOR : 
                       invoice.status === 'OVERDUE' ? DANGER_COLOR : 
                       WARNING_COLOR;
      doc.setTextColor(restColor);
      doc.text(formatCurrency(invoice.amountDue), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
      yPos += 15;
    }

    // ===== NOTES ET CONDITIONS =====
    if (invoice.notes || invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(PRIMARY_COLOR);
      doc.text('INFORMATIONS ADDITIONNELLES', MARGIN, yPos);
      yPos += 7;
      
      doc.setDrawColor(LIGHT_GRAY);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, yPos, MARGIN + 80, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(DARK_GRAY);
      
      if (invoice.notes) {
        doc.text('Notes:', MARGIN, yPos);
        const notes = doc.splitTextToSize(invoice.notes, CONTENT_WIDTH);
        doc.text(notes, MARGIN + 20, yPos);
        yPos += (notes.length * 5) + 10;
      }
      
      if (invoice.terms) {
        doc.text('Conditions de paiement:', MARGIN, yPos);
        const terms = doc.splitTextToSize(invoice.terms, CONTENT_WIDTH);
        doc.text(terms, MARGIN + 20, yPos);
        yPos += (terms.length * 5) + 10;
      }
    }

    // ===== PIED DE PAGE =====
    yPos = PAGE_HEIGHT - MARGIN - 20;
    
    // Ligne de séparation
    doc.setDrawColor(DARK_GRAY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos += 5;
    
    // Informations de pied de page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DARK_GRAY);
    
    doc.text('Merci pour votre confiance!', MARGIN, yPos);
    doc.text(`Facture générée le ${formatDate(new Date())}`, PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 5;
    
    if (invoice.company.companyEmail) {
      doc.text(`Pour toute question, contactez: ${invoice.company.companyEmail}`, MARGIN, yPos);
    }

    // Numéro de page
    doc.setFontSize(7);
    doc.text(`Page 1/1`, PAGE_WIDTH / 2, yPos, { align: 'center' });

    // ===== GÉNÉRER LE PDF =====
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}

// lib/image-loader.ts (à créer)
/*
export async function loadImage(url: string): Promise<string> {
  // Implémentez le chargement d'image selon votre stockage
  // Exemple pour une URL publique:
  // const response = await fetch(url);
  // const blob = await response.blob();
  // return new Promise((resolve) => {
  //   const reader = new FileReader();
  //   reader.onloadend = () => resolve(reader.result as string);
  //   reader.readAsDataURL(blob);
  // });
  return url; // Retourne l'URL telle quelle pour l'exemple
}
*/