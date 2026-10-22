import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { reconcilePayments } from './payments';

const str = (v: { toFixed(n: number): string } | null) => v?.toFixed(2) ?? null;

describe('reconcilePayments', () => {
  it.each(['CASH', 'UPI', 'CARD'] as const)('accepts exact %s', (method) => {
    const r = reconcilePayments(250.5, [{ method, amount: 250.5 }]);
    expect(r.paymentMethod).toBe(method);
    expect(r.legs.map((l) => [l.method, l.amount.toFixed(2)])).toEqual([
      [method, '250.50'],
    ]);
    expect(r.cashTendered).toBeNull();
    expect(r.changeDue).toBeNull();
  });

  it('rejects an underpayment with the shortfall', () => {
    expect(() =>
      reconcilePayments(500, [{ method: 'CASH', amount: 499.99 }]),
    ).toThrow(new BadRequestException('Payment short by ₹0.01'));
  });

  it('computes change for cash tendered above the bill', () => {
    const r = reconcilePayments(
      437.5,
      [{ method: 'CASH', amount: 437.5 }],
      500,
    );
    expect(str(r.cashTendered)).toBe('500.00');
    expect(str(r.changeDue)).toBe('62.50');
    expect(r.legs[0].amount.toFixed(2)).toBe('437.50');
  });

  it('reads an over-sized cash leg as tendered cash', () => {
    const r = reconcilePayments(437.5, [{ method: 'CASH', amount: 500 }]);
    expect(r.legs[0].amount.toFixed(2)).toBe('437.50');
    expect(str(r.cashTendered)).toBe('500.00');
    expect(str(r.changeDue)).toBe('62.50');
  });

  it('rejects cash tendered below the cash leg', () => {
    expect(() =>
      reconcilePayments(500, [{ method: 'CASH', amount: 500 }], 400),
    ).toThrow('Cash short by ₹100.00');
  });

  it.each(['UPI', 'CARD'] as const)('rejects %s overpayment', (method) => {
    expect(() => reconcilePayments(500, [{ method, amount: 600 }])).toThrow(
      /exceed the bill by ₹100.00/,
    );
  });

  it('rejects cash tendered without a cash leg', () => {
    expect(() =>
      reconcilePayments(500, [{ method: 'UPI', amount: 500 }], 500),
    ).toThrow(/no cash payment/);
  });

  it('accepts an exact split and records each leg', () => {
    const r = reconcilePayments(1000, [
      { method: 'CASH', amount: 300 },
      { method: 'UPI', amount: 450.25 },
      { method: 'CARD', amount: 249.75 },
    ]);
    expect(r.paymentMethod).toBe('SPLIT');
    expect(r.legs.map((l) => [l.method, l.amount.toFixed(2)])).toEqual([
      ['CASH', '300.00'],
      ['UPI', '450.25'],
      ['CARD', '249.75'],
    ]);
  });

  it('gives change on the cash leg of a split', () => {
    const r = reconcilePayments(
      1000,
      [
        { method: 'UPI', amount: 700 },
        { method: 'CASH', amount: 300 },
      ],
      500,
    );
    expect(str(r.changeDue)).toBe('200.00');
  });

  it('rejects a short split', () => {
    expect(() =>
      reconcilePayments(1000, [
        { method: 'CASH', amount: 300 },
        { method: 'UPI', amount: 600 },
      ]),
    ).toThrow('Payment short by ₹100.00');
  });

  it('rejects a split overpaid beyond the cash leg', () => {
    expect(() =>
      reconcilePayments(1000, [
        { method: 'CASH', amount: 100 },
        { method: 'UPI', amount: 1000 },
      ]),
    ).toThrow(/exceed the bill/);
  });

  it('rejects duplicate methods', () => {
    expect(() =>
      reconcilePayments(100, [
        { method: 'UPI', amount: 50 },
        { method: 'UPI', amount: 50 },
      ]),
    ).toThrow(/more than once/);
  });
});

describe('CreatePosOrderDto payments', () => {
  const base = {
    paymentMethod: 'CASH',
    items: [{ customName: 'Manual', quantity: 1, unitPrice: 10 }],
  };
  const errors = (extra: object) =>
    validateSync(plainToInstance(CreatePosOrderDto, { ...base, ...extra }), {
      whitelist: true,
      forbidNonWhitelisted: true,
    }).map((e) => e.property);

  it('stays valid without payments (legacy clients)', () => {
    expect(errors({})).toEqual([]);
    expect(errors({ paymentMethod: 'UPI_CARD' })).toEqual([]);
  });

  it('accepts up to three legs', () => {
    expect(
      errors({
        paymentMethod: 'SPLIT',
        payments: [
          { method: 'CASH', amount: 1 },
          { method: 'UPI', amount: 4 },
          { method: 'CARD', amount: 5 },
        ],
        cashTendered: 10,
      }),
    ).toEqual([]);
  });

  it.each([
    [[]],
    [[{ method: 'CASH', amount: 0 }]],
    [[{ method: 'CASH', amount: 1.005 }]],
    [[{ method: 'ONLINE', amount: 10 }]],
    [
      [
        { method: 'CASH', amount: 5 },
        { method: 'CASH', amount: 5 },
      ],
    ],
  ])('rejects payments %j', (payments) => {
    expect(errors({ payments })).toContain('payments');
  });
});
