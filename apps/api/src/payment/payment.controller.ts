import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  // Called by frontend to get txnToken
  @Post('initiate')
  async initiate(@Body() body: InitiatePaymentDto) {
    return this.svc.initiatePayment(body.orderId, body.custId);
  }

  // Paytm POSTs to this URL after payment completes
  @Post('callback')
  async callback(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.svc.handleCallback(body);

      const paid =
        result.status === 'TXN_SUCCESS' &&
        (await this.svc.completeOrder(result.orderId, result.amount));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const page = paid ? 'success' : 'failure';

      return res.redirect(
        `${frontendUrl}/payment/${page}?orderId=${encodeURIComponent(String(result.orderId))}`,
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
