import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { PaymentTransactionService } from './payment-transaction.service';

@ApiBearerAuth()
@ApiTags('Payment Transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/payment-transaction')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  // ==============================
  // EXISTING ENDPOINTS
  // ==============================

  @ApiOperation({ summary: 'Get all payment transactions' })
  @Get()
  async findAll(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const paymentTransactions =
        await this.paymentTransactionService.findAll(user_id);
      return paymentTransactions;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get a single payment transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const paymentTransaction = await this.paymentTransactionService.findOne(
        id,
        user_id,
      );
      return paymentTransaction;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete a payment transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const paymentTransaction = await this.paymentTransactionService.remove(
        id,
        user_id,
      );
      return paymentTransaction;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ==============================
  // NEW PAYMENT ENDPOINTS
  // ==============================

  /**
   * Create Invoice for Client
   * POST /admin/payment-transaction/create-invoice
   */
  @ApiOperation({ summary: 'Create an invoice for a client' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', example: 'cms4i4rt50000nujy0yjsp5sw' },
        planName: {
          type: 'string',
          enum: ['BASIC', 'STANDARD', 'PREMIUM'],
          example: 'BASIC',
        },
      },
      required: ['clientId', 'planName'],
    },
  })
  @Post('create-invoice')
  async createInvoice(@Body() data: { clientId: string; planName: string }) {
    try {
      return await this.paymentTransactionService.createInvoice(
        data.clientId,
        data.planName,
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get Client Payment Status
   * GET /admin/payment-transaction/client-status/:clientId
   */
  @ApiOperation({ summary: 'Get client payment status' })
  @ApiParam({ name: 'clientId', description: 'Client User ID' })
  @Get('client-status/:clientId')
  async getClientPaymentStatus(@Param('clientId') clientId: string) {
    try {
      return await this.paymentTransactionService.getClientPaymentStatus(
        clientId,
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Check Pending Invoice
   * GET /admin/payment-transaction/pending/:clientId
   */
  @ApiOperation({ summary: 'Check if client has a pending invoice' })
  @ApiParam({ name: 'clientId', description: 'Client User ID' })
  @Get('pending/:clientId')
  async hasPendingInvoice(@Param('clientId') clientId: string) {
    try {
      return await this.paymentTransactionService.hasPendingInvoice(clientId);
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get All Invoices (with filters)
   * GET /admin/payment-transaction/invoices?status=paid&clientId=xxx
   */
  @ApiOperation({ summary: 'Get all invoices with optional filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'failed', 'expired'],
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filter by client ID',
  })
  @Get('invoices')
  async getAllInvoices(
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    try {
      return await this.paymentTransactionService.getAllInvoices({
        status,
        clientId,
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get Invoice by ID
   * GET /admin/payment-transaction/invoice/:id
   */
  @ApiOperation({ summary: 'Get invoice by ID with full details' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @Get('invoice/:id')
  async getInvoiceById(@Param('id') id: string) {
    try {
      return await this.paymentTransactionService.getInvoiceById(id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Cancel Invoice
   * PATCH /admin/payment-transaction/cancel-invoice/:id
   */
  @ApiOperation({ summary: 'Cancel a pending invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @Patch('cancel-invoice/:id')
  async cancelInvoice(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      return await this.paymentTransactionService.cancelInvoice(id, user_id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get Payment Statistics
   * GET /admin/payment-transaction/stats
   */
  @ApiOperation({ summary: 'Get payment statistics for admin dashboard' })
  @Get('stats')
  async getPaymentStats() {
    try {
      return await this.paymentTransactionService.getPaymentStats();
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
