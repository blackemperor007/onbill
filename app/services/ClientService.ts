// // app/services/clientService.ts

// import { Prisma } from "@/lib/generated/prisma/client";
// import prisma from "@/lib/prisma";

// // Type pour la réponse de suppression
// export type DeleteClientResult = {
//   success: boolean;
//   message?: string;
//   data?: {
//     clientId: string;
//     deletedAt: string;
//     hadInvoices: number;
//   };
//   error?: string;
//   details?: any;
// };

// // Type pour la vérification de suppression
// export type CanDeleteClientResult = {
//   canDelete: boolean;
//   reason?: string;
//   details?: {
//     totalInvoices: number;
//     totalPayments: number;
//     unpaidCount?: number;
//     totalAmountDue?: number;
//   };
// };

// export class ClientService {
//   /**
//    * Supprime un client avec vérification des dépendances
//    */
//   static async deleteClient(
//     clientId: string, 
//     companyId: string
//   ): Promise<DeleteClientResult> {
//     try {
//       // Vérifier les dépendances
//       const client = await prisma.client.findUnique({
//         where: { id: clientId },
//         include: {
//           invoices: {
//             select: { 
//               id: true, 
//               status: true, 
//               amountDue: true 
//             }
//           }
//         }
//       });

//       if (!client) {
//         return {
//           success: false,
//           error: 'Client non trouvé'
//         };
//       }

//       if (client.companyId !== companyId) {
//         return {
//           success: false,
//           error: 'Non autorisé'
//         };
//       }

//       // Vérifier les factures impayées
//       const hasUnpaidInvoices = client.invoices.some(
//         invoice => invoice.amountDue > 0
//       );

//       if (hasUnpaidInvoices) {
//         return {
//           success: false,
//           error: 'Le client a des factures impayées',
//           details: {
//             invoices: client.invoices
//               .filter(inv => inv.amountDue > 0)
//               .map(inv => ({ id: inv.id, amountDue: inv.amountDue }))
//           }
//         };
//       }

//       // Suppression en transaction
//       await prisma.$transaction(async (tx) => {
//         await tx.client.delete({
//           where: { id: clientId }
//         });
//       });

//       return {
//         success: true,
//         message: 'Client supprimé avec succès',
//         data: {
//           clientId,
//           deletedAt: new Date().toISOString(),
//           hadInvoices: client.invoices.length
//         }
//       };

//     } catch (error) {
//       console.error('Error in ClientService.deleteClient:', error);
      
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2025':
//             return {
//               success: false,
//               error: 'Client non trouvé'
//             };
//           case 'P2003':
//             return {
//               success: false,
//               error: 'Impossible de supprimer, références existantes'
//             };
//         }
//       }

//       return {
//         success: false,
//         error: 'Erreur lors de la suppression'
//       };
//     }
//   }

//   /**
//    * Vérifie si un client peut être supprimé
//    */
//   static async canDeleteClient(
//     clientId: string, 
//     companyId: string
//   ): Promise<CanDeleteClientResult> {
//     try {
//       const client = await prisma.client.findUnique({
//         where: { id: clientId },
//         include: {
//           invoices: {
//             where: {
//               amountDue: { gt: 0 }
//             },
//             select: { 
//               id: true,
//               invoiceNumber: true,
//               status: true, 
//               amountDue: true 
//             }
//           },
//           _count: {
//             select: {
//               invoices: true,
//               payments: true
//             }
//           }
//         }
//       });

//       if (!client) {
//         return {
//           canDelete: false,
//           reason: 'Client non trouvé'
//         };
//       }

//       if (client.companyId !== companyId) {
//         return {
//           canDelete: false,
//           reason: 'Non autorisé'
//         };
//       }

//       if (client.invoices.length > 0) {
//         return {
//           canDelete: false,
//           reason: 'Le client a des factures impayées',
//           details: {
//             totalInvoices: client._count.invoices,
//             totalPayments: client._count.payments,
//             unpaidCount: client.invoices.length,
//             totalAmountDue: client.invoices.reduce(
//               (sum, inv) => sum + inv.amountDue, 
//               0
//             ),
//             unpaidInvoices: client.invoices.map(inv => ({
//               id: inv.id,
//               invoiceNumber: inv.invoiceNumber,
//               amountDue: inv.amountDue
//             }))
//           }
//         };
//       }

//       return {
//         canDelete: true,
//         details: {
//           totalInvoices: client._count.invoices,
//           totalPayments: client._count.payments
//         }
//       };

//     } catch (error) {
//       console.error('Error in ClientService.canDeleteClient:', error);
//       return {
//         canDelete: false,
//         reason: 'Erreur lors de la vérification'
//       };
//     }
//   }

//   /**
//    * Supprime un client avec option de force
//    */
//   static async forceDeleteClient(
//     clientId: string, 
//     companyId: string
//   ): Promise<DeleteClientResult> {
//     try {
//       // Vérifier que le client existe et appartient à la company
//       const client = await prisma.client.findUnique({
//         where: { id: clientId },
//         include: {
//           _count: {
//             select: {
//               invoices: true,
//               payments: true
//             }
//           }
//         }
//       });

//       if (!client) {
//         return {
//           success: false,
//           error: 'Client non trouvé'
//         };
//       }

//       if (client.companyId !== companyId) {
//         return {
//           success: false,
//           error: 'Non autorisé'
//         };
//       }

//       // Suppression en transaction avec cascade
//       await prisma.$transaction(async (tx) => {
//         // 1. Supprimer les paiements non liés à des factures
//         await tx.payment.deleteMany({
//           where: { 
//             clientId,
//             invoiceId: null 
//           }
//         });

//         // 2. Supprimer le client (les factures et paiements liés seront supprimés par cascade)
//         await tx.client.delete({
//           where: { id: clientId }
//         });
//       });

//       return {
//         success: true,
//         message: 'Client supprimé avec succès (suppression forcée)',
//         data: {
//           clientId,
//           deletedAt: new Date().toISOString(),
//           hadInvoices: client._count.invoices,
//           hadPayments: client._count.payments
//         }
//       };

//     } catch (error) {
//       console.error('Error in ClientService.forceDeleteClient:', error);
      
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2025':
//             return {
//               success: false,
//               error: 'Client non trouvé'
//             };
//           case 'P2003':
//             return {
//               success: false,
//               error: 'Violation de contrainte de clé étrangère'
//             };
//         }
//       }

//       return {
//         success: false,
//         error: 'Erreur lors de la suppression forcée'
//       };
//     }
//   }

//   /**
//    * Récupère un client avec toutes ses dépendances
//    */
//   static async getClientWithDependencies(
//     clientId: string, 
//     companyId: string
//   ) {
//     try {
//       const client = await prisma.client.findUnique({
//         where: {
//           id: clientId,
//           companyId: companyId
//         },
//         include: {
//           invoices: {
//             select: {
//               id: true,
//               invoiceNumber: true,
//               status: true,
//               total: true,
//               amountDue: true,
//               dueDate: true,
//               issueDate: true,
//               items: {
//                 select: {
//                   description: true,
//                   quantity: true,
//                   unitPrice: true
//                 },
//                 take: 3
//               }
//             },
//             orderBy: { issueDate: 'desc' },
//             take: 10
//           },
//           payments: {
//             select: {
//               id: true,
//               amount: true,
//               paymentDate: true,
//               paymentMethod: true,
//               invoiceId: true,
//               invoice: {
//                 select: {
//                   invoiceNumber: true
//                 }
//               }
//             },
//             orderBy: { paymentDate: 'desc' },
//             take: 10
//           },
//           company: {
//             select: {
//               id: true,
//               companyName: true,
//               currency: true
//             }
//           },
//           _count: {
//             select: {
//               invoices: true,
//               payments: true
//             }
//           }
//         }
//       });

//       if (!client) {
//         throw new Error('Client non trouvé');
//       }

//       return {
//         success: true as const,
//         data: client
//       };

//     } catch (error) {
//       console.error('Error in ClientService.getClientWithDependencies:', error);
      
//       return {
//         success: false as const,
//         error: error instanceof Error ? error.message : 'Erreur inconnue'
//       };
//     }
//   }
// }