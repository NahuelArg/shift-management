import { resolveClientIp } from './client-ip-throttler.guard';

describe('resolveClientIp', () => {
  const HEADER = 'cf-connecting-ip';

  it('usa req.ip si CLIENT_IP_HEADER no está definido (aunque llegue la cabecera)', () => {
    const req = { ip: '10.0.0.1', headers: { [HEADER]: '203.0.113.9' } };
    expect(resolveClientIp(req, undefined)).toBe('10.0.0.1');
    expect(resolveClientIp(req, '  ')).toBe('10.0.0.1');
  });

  it('usa la cabecera configurada cuando llega', () => {
    const req = { ip: '10.0.0.1', headers: { [HEADER]: '203.0.113.9' } };
    expect(resolveClientIp(req, HEADER)).toBe('203.0.113.9');
  });

  it('el nombre de la cabecera no distingue mayúsculas (Node las pasa a minúsculas)', () => {
    const req = { ip: '10.0.0.1', headers: { [HEADER]: '203.0.113.9' } };
    expect(resolveClientIp(req, 'CF-Connecting-IP')).toBe('203.0.113.9');
  });

  it('vuelve a req.ip si la cabecera configurada no llega o está vacía', () => {
    expect(resolveClientIp({ ip: '10.0.0.1', headers: {} }, HEADER)).toBe(
      '10.0.0.1',
    );
    expect(
      resolveClientIp({ ip: '10.0.0.1', headers: { [HEADER]: ' ' } }, HEADER),
    ).toBe('10.0.0.1');
  });

  it('con varios valores toma solo el primero', () => {
    const req = {
      ip: '10.0.0.1',
      headers: { [HEADER]: ['203.0.113.9', '198.51.100.1'] },
    };
    expect(resolveClientIp(req, HEADER)).toBe('203.0.113.9');
    expect(
      resolveClientIp(
        { headers: { [HEADER]: '203.0.113.9, 198.51.100.1' } },
        HEADER,
      ),
    ).toBe('203.0.113.9');
  });

  it('ignora X-Forwarded-For: no sirve para elegir la IP', () => {
    const req = {
      ip: '10.0.0.1',
      headers: { 'x-forwarded-for': '198.51.100.7', [HEADER]: '203.0.113.9' },
    };
    expect(resolveClientIp(req, HEADER)).toBe('203.0.113.9');
  });
});
