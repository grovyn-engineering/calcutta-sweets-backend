import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { dec } from '../common/money';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { PosOrderLineDto } from './dto/create-pos-order.dto';
import { computeBill, type PricedLine } from './orders.service';

function priceErrors<T extends object>(cls: new () => T, plain: object) {
  return validateSync(plainToInstance(cls, plain)).filter((e) =>
    ['price', 'unitPrice'].includes(e.property),
  );
}

describe('price policy', () => {
  const product = { name: 'Mithai Ragi Ladoo', unit: 'KG' };
  const line = { customName: 'Manual', quantity: 1 };

  it.each([0, -5, 1_000_000.01, 12.345, Number.NaN])(
    'rejects catalog price %p',
    (price) => {
      expect(priceErrors(CreateProductDto, { ...product, price })).toHaveLength(
        1,
      );
    },
  );

  it.each([0.01, 520, 520.5, 1_000_000])(
    'accepts catalog price %p',
    (price) => {
      expect(priceErrors(CreateProductDto, { ...product, price })).toHaveLength(
        0,
      );
    },
  );

  it.each([0, -1, 99_999_999, 0.005])(
    'rejects manual bill line price %p',
    (unitPrice) => {
      expect(priceErrors(PosOrderLineDto, { ...line, unitPrice })).toHaveLength(
        1,
      );
    },
  );

  it('rejects a bill whose total exceeds the per-sale cap', () => {
    const big = {
      quantity: dec(100),
      price: dec(1_000_000),
      taxRate: dec(5),
    } as PricedLine;
    expect(() => computeBill([big], 0)).toThrow(BadRequestException);
  });
});
