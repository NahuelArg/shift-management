import { Prisma } from '@prisma/client';
import { decimalsToNumbers } from './decimal-to-number.interceptor';

describe('decimalsToNumbers', () => {
  it('converts nested Prisma.Decimal values to numbers', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const input = {
      finalPrice: new Prisma.Decimal('1500.50'),
      date,
      service: { price: new Prisma.Decimal('2500.00'), name: 'Corte' },
      list: [{ amount: new Prisma.Decimal('0.10') }, null],
    };
    expect(decimalsToNumbers(input)).toEqual({
      finalPrice: 1500.5,
      date,
      service: { price: 2500, name: 'Corte' },
      list: [{ amount: 0.1 }, null],
    });
  });

  it('keeps Decimal arithmetic exact before converting (0.1 + 0.2)', () => {
    const sum = new Prisma.Decimal('0.1').plus(new Prisma.Decimal('0.2'));
    expect(decimalsToNumbers(sum)).toBe(0.3); // con Float: 0.30000000000000004
  });
});
