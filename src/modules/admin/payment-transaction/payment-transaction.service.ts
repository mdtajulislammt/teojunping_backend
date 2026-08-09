// src/modules/payment/payment-transaction.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { UserType } from '@prisma/client';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';

@Injectable()
export class PaymentTransactionService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  // ==============================
  // EXISTING METHODS
  // ==============================

  async findAll(user_id?: string) {
    try {
      const userDetails = await this.userRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == UserType.EDITOR) {
        whereClause['user_id'] = user_id;
      }

      const paymentTransactions = await this.prisma.paymentTransaction.findMany(
        {
          where: {
            ...whereClause,
          },
          select: {
            id: true,
            reference_number: true,
            status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
          },
        },
      );

      return {
        success: true,
        data: paymentTransactions,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, user_id?: string) {
    try {
      const userDetails = await this.userRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == UserType.EDITOR) {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
          select: {
            id: true,
            reference_number: true,
            status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      return {
        success: true,
        data: paymentTransaction,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string, user_id?: string) {
    try {
      const userDetails = await this.userRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == UserType.EDITOR) {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      await this.prisma.paymentTransaction.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: 'Payment transaction deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ==============================
  // NEW PAYMENT METHODS
  // ==============================

  /**
   * Create an invoice for a client after registration
   */
  async createInvoice(clientId: string, planName: string) {
    try {
      // 1. Get client
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // 2. Get plan details by name
      const plan = await this.prisma.plan.findUnique({
        where: { name: planName },
      });
      if (!plan) {
        throw new NotFoundException(`Plan ${planName} not found`);
      }

      // 3. Check if client already has a pending invoice
      const existingPending = await this.prisma.paymentTransaction.findFirst({
        where: {
          user_id: clientId,
          status: 'pending',
        },
      });

      if (existingPending) {
        throw new BadRequestException('Client already has a pending invoice');
      }

      // 4. Get or create Stripe customer
      let stripeCustomerId = client.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await StripePayment.createCustomer({
          user_id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
        });
        stripeCustomerId = customer.id;

        await this.prisma.user.update({
          where: { id: client.id },
          data: { stripe_customer_id: stripeCustomerId },
        });
      }

      // 5. Create payment transaction (unpaid invoice)
      const transaction = await this.prisma.paymentTransaction.create({
        data: {
          user_id: clientId,
          plan_id: plan.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'pending',
          stripe_customer_id: stripeCustomerId,
          provider: 'stripe',
          // Invoice expires in 7 days
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // 6. Create Stripe Payment Intent
      const paymentIntent = await StripePayment.createPaymentIntent({
        amount: Number(plan.price),
        currency: plan.currency,
        customer_id: stripeCustomerId,
        metadata: {
          transaction_id: transaction.id,
          client_id: clientId,
          plan_name: plan.name,
          type: 'subscription_payment',
        },
      });

      // 7. Update transaction with Stripe PI ID
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          stripe_pi_id: paymentIntent.id,
          reference_number: paymentIntent.id,
        },
      });

      return {
        success: true,
        data: {
          transaction_id: transaction.id,
          client_secret: paymentIntent.client_secret,
          amount: plan.price,
          currency: plan.currency,
          plan: plan.display_name,
          plan_name: plan.name,
          status: 'pending',
          expires_at: transaction.expires_at,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Handle successful payment (called from webhook)
   */
  async handleSuccessfulPayment(transactionId: string, stripePiId: string) {
    try {
      const transaction = await this.prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: { plan: true },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Check if already paid
      if (transaction.status === 'paid') {
        return {
          success: true,
          message: 'Transaction already paid',
        };
      }

      // Update transaction status
      await this.prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'paid',
          paid_at: new Date(),
          stripe_pi_id: stripePiId,
          reference_number: stripePiId,
        },
      });

      // Update user's service plan
      if (transaction.plan) {
        await this.prisma.user.update({
          where: { id: transaction.user_id },
          data: {
            plan_id: transaction.plan_id,
          },
        });
      }

      return {
        success: true,
        message: 'Payment processed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get client's payment status
   */
  async getClientPaymentStatus(clientId: string) {
    try {
      const transactions = await this.prisma.paymentTransaction.findMany({
        where: {
          user_id: clientId,
          status: { in: ['pending', 'paid'] },
        },
        include: { plan: true },
        orderBy: { created_at: 'desc' },
      });

      const pending = transactions.find((t) => t.status === 'pending');
      const paid = transactions.find((t) => t.status === 'paid');

      return {
        success: true,
        data: {
          has_pending_payment: !!pending,
          pending: pending
            ? {
                transaction_id: pending.id,
                amount: pending.amount,
                plan: pending.plan?.display_name,
                plan_name: pending.plan?.name,
                created_at: pending.created_at,
                expires_at: pending.expires_at,
              }
            : null,
          has_paid_subscription: !!paid,
          paid: paid
            ? {
                transaction_id: paid.id,
                amount: paid.amount,
                plan: paid.plan?.display_name,
                plan_name: paid.plan?.name,
                paid_at: paid.paid_at,
              }
            : null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Check if client has a pending invoice
   */
  async hasPendingInvoice(clientId: string) {
    try {
      const pending = await this.prisma.paymentTransaction.findFirst({
        where: {
          user_id: clientId,
          status: 'pending',
        },
      });

      return {
        success: true,
        data: {
          has_pending_invoice: !!pending,
          transaction_id: pending?.id || null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get all invoices (Admin only)
   */
  async getAllInvoices(filters?: { status?: string; clientId?: string }) {
    try {
      const whereClause: any = {};

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.clientId) {
        whereClause.user_id = filters.clientId;
      }

      const invoices = await this.prisma.paymentTransaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              display_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        data: invoices,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get invoice by ID with full details
   */
  async getInvoiceById(invoiceId: string) {
    try {
      const invoice = await this.prisma.paymentTransaction.findUnique({
        where: { id: invoiceId },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone_number: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              display_name: true,
              price: true,
              features: true,
            },
          },
        },
      });

      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      return {
        success: true,
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Cancel a pending invoice
   */
  async cancelInvoice(invoiceId: string, userId?: string) {
    try {
      const invoice = await this.prisma.paymentTransaction.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      if (invoice.status !== 'pending') {
        return {
          success: false,
          message: 'Only pending invoices can be cancelled',
        };
      }

      // Cancel the payment intent in Stripe if exists
      if (invoice.stripe_pi_id) {
        try {
          await StripePayment.cancelPaymentIntent(invoice.stripe_pi_id);
        } catch (stripeError) {
          console.error('Stripe cancel error:', stripeError);
          // Continue even if Stripe cancel fails
        }
      }

      await this.prisma.paymentTransaction.update({
        where: { id: invoiceId },
        data: {
          status: 'failed',
        },
      });

      return {
        success: true,
        message: 'Invoice cancelled successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get payment statistics (for admin dashboard)
   */
  async getPaymentStats() {
    try {
      const [totalRevenue, pendingAmount, totalInvoices, overdueInvoices] =
        await Promise.all([
          this.prisma.paymentTransaction.aggregate({
            where: { status: 'paid' },
            _sum: { amount: true },
          }),
          this.prisma.paymentTransaction.aggregate({
            where: { status: 'pending' },
            _sum: { amount: true },
          }),
          this.prisma.paymentTransaction.count(),
          this.prisma.paymentTransaction.count({
            where: {
              status: 'pending',
              expires_at: {
                lt: new Date(),
              },
            },
          }),
        ]);

      return {
        success: true,
        data: {
          total_revenue: totalRevenue._sum.amount || 0,
          pending_amount: pendingAmount._sum.amount || 0,
          total_invoices: totalInvoices,
          overdue_invoices: overdueInvoices,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
