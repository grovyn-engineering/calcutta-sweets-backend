import { Injectable, HttpException } from '@nestjs/common';
import * as PaytmChecksum from 'paytmchecksum';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { OrderStatus } from '@calcutta/database';

@Injectable()
export class PaymentService {
  private readonly mid: string;
  private readonly key: string;
  private readonly website: string;
  private readonly appUrl: string;
  private readonly isProd: boolean;

  constructor(private readonly prisma: PrismaService) {
    this.mid = process.env.PAYTM_MID || 'YOUR_MID';
    this.key = process.env.PAYTM_MERCHANT_KEY || '16CharsLongKeyXX';
    this.website = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
    this.appUrl = process.env.APP_URL || 'http://localhost:8080';
    this.isProd = process.env.NODE_ENV === 'production';

    if (this.key.length !== 16) {
      console.error(
        'CRITICAL: PAYTM_MERCHANT_KEY must be exactly 16 characters. ' +
        `Current length: ${this.key.length}. ` +
        'Please check your .env file.'
      );
    }
  }

  private get baseUrl() {
    return this.isProd
      ? 'https://securegw.paytm.in'
      : 'https://securegw-stage.paytm.in';
  }

  // STEP A: Initiate - call before showing the payment modal
  async initiatePayment(orderId: string, amount: number, custId: string) {
    const body = {
      requestType: 'Payment',
      mid: this.mid,
      websiteName: this.website,
      orderId,
      callbackUrl: `${this.appUrl}/api/payment/callback`,
      txnAmount: { value: amount.toFixed(2), currency: 'INR' },
      userInfo: { custId },
    };

    let signature: string;
    try {
      signature = await PaytmChecksum.generateSignature(
        JSON.stringify(body),
        this.key,
      );
    } catch (error) {
      console.error('Paytm Signature Generation Error:', error.message);
      throw new HttpException(
        'Payment encryption failed. This is usually due to an invalid PAYTM_MERCHANT_KEY length (must be 16 chars).',
        500
      );
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/theia/api/v1/initiateTransaction` +
        `?mid=${this.mid}&orderId=${orderId}`,
        { head: { signature }, body },
      );

      if (response.data.body.resultInfo.resultCode !== '0000') {
        throw new HttpException(response.data.body.resultInfo.resultMsg, 400);
      }

      return {
        orderId,
        txnToken: response.data.body.txnToken,
        amount: amount.toFixed(2),
        mid: this.mid,
      };
    } catch (error) {
      console.error('Paytm Initiate Error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.body?.resultInfo?.resultMsg || 'Payment initiation failed',
        400,
      );
    }
  }

  // STEP B: Handle callback - Paytm POSTs here after payment
  async handleCallback(callbackBody: Record<string, any>) {
    const { CHECKSUMHASH, ...params } = callbackBody;

    if (!CHECKSUMHASH) {
      throw new HttpException('Missing checksum hash', 400);
    }

    const isValid = await PaytmChecksum.verifySignature(
      params,
      this.key,
      CHECKSUMHASH,
    );
    if (!isValid) throw new HttpException('Invalid checksum', 400);

    return {
      orderId: params.ORDERID,
      status: params.STATUS, // TXN_SUCCESS | TXN_FAILURE | PENDING
      txnId: params.TXNID,
      amount: params.TXNAMOUNT,
    };
  }

  // STEP C: Verify - always double-check via API (never trust callback alone)
  async verifyPayment(orderId: string) {
    const body = { mid: this.mid, orderId };
    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      this.key,
    );

    const response = await axios.post(`${this.baseUrl}/v3/order/status`, {
      head: { signature },
      body,
    });

    return response.data.body;
  }

  async completeOrder(orderId: string, paymentMethod: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new HttpException('Order not found', 404);
    }

    // If already PAID, skip (prevents double processing)
    if (order.status === OrderStatus.PAID) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Finalize the order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentMethod,
        },
      });

      // 2. Decrement inventory
      for (const item of order.items) {
        if (item.productVariantId) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      }
    });
  }
}
