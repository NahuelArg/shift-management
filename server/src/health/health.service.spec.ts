import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const prismaMock = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('check() returns ok without touching the database', () => {
    const result = service.check();
    expect(result.status).toBe('ok');
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('checkDatabase() returns database up when the query succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const result = await service.checkDatabase();
    expect(result.database).toBe('up');
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('checkDatabase() throws 503 when the query fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));
    await expect(service.checkDatabase()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
