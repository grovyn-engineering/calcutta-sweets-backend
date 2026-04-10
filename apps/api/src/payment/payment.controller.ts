import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly svc: PaymentService,
  ) {}

  // Called by frontend to get txnToken
  @Post('initiate')
  async initiate(
    @Body() body: { orderId: string; amount: number; custId: string },
  ) {
    return this.svc.initiatePayment(body.orderId, body.amount, body.custId);
  }

  // Paytm POSTs to this URL after payment completes
  @Post('callback')
  async callback(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.svc.handleCallback(body);
      
      if (result.status === 'TXN_SUCCESS') {
        await this.svc.completeOrder(result.orderId, 'ONLINE');
      }

      // Result redirect...
      // For now, we redirect to the frontend with the status
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const page = result.status === 'TXN_SUCCESS' ? 'success' : 'failure';
      
      return res.redirect(
        `${frontendUrl}/payment/${page}?orderId=${result.orderId}`,
      );
    } catch (e) {
      console.error('Callback error:', e);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/failure`);
    }
  }

  // Frontend calls this to double-verify after redirect
  @Get('verify/:orderId')
  async verify(@Param('orderId') orderId: string) {
    return this.svc.verifyPayment(orderId);
  }
}
