import {
  customerSearchWhere,
  orderSearchOr,
  phoneDigitsQuery,
} from './customer-search';

describe('phoneDigitsQuery', () => {
  it('strips formatting from phone-like terms', () => {
    expect(phoneDigitsQuery('+91 98765-43210')).toBe('919876543210');
    expect(phoneDigitsQuery(' 987 ')).toBe('987');
  });

  it('ignores names and very short digit runs', () => {
    expect(phoneDigitsQuery('Ravi 98')).toBeNull();
    expect(phoneDigitsQuery('98')).toBeNull();
  });
});

describe('customerSearchWhere', () => {
  it('only scopes by shop when q is blank', () => {
    expect(customerSearchWhere('S1', '  ')).toEqual({ shopCode: 'S1' });
  });

  it('matches name only for text queries', () => {
    expect(customerSearchWhere('S1', 'ravi')).toEqual({
      shopCode: 'S1',
      OR: [{ name: { contains: 'ravi', mode: 'insensitive' } }],
    });
  });

  it('also matches phone digits for numeric queries', () => {
    expect(customerSearchWhere('S1', '98765 4').OR).toEqual([
      { name: { contains: '98765 4', mode: 'insensitive' } },
      { phone: { contains: '987654' } },
    ]);
  });
});

describe('orderSearchOr', () => {
  it('searches phone by digits', () => {
    expect(orderSearchOr('98765-43210')).toContainEqual({
      customerPhone: { contains: '9876543210' },
    });
  });
});
