import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'



jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>()
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn()
          }
        },

      ]
    }).compile();
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService)
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const mockUser = {
        id: '1',
        name: 'name',
        email: 'test@test.com',
        password:'passwordHashed',
        phone: null,
        role: 'CLIENT',
        businessId: null,
        createdAt: expect.any(Date),
        authProvider: 'LOCAL'
      }
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      await expect(() => service.register({
        name: mockUser.name,
        email: mockUser.email
      })).rejects.toThrow(ConflictException)
    })
    it('should throw BadRequestException if AuthProvider is LOCAL and password is null', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(() => service.register({
        name: mockUser.name,
        email: mockUser.email,
        authProvider: 'LOCAL',
      })).rejects.toThrow(BadRequestException)
    })
    it('should throw BadRequestException if password < 6 characters', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(() => service.register({
        name: 'John',
        email: 'email@test.com',
        password: 'error'
      })).rejects.toThrow(BadRequestException)
    })
    it('should return code 200 success register', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: '1',
        name: 'name',
        email: 'test@test.com',
        phone: null,
        role: 'CLIENT',
        businessId: null,
        createdAt: expect.any(Date),
        authProvider: 'GOOGLE'
      } as any)
      await expect(service.register({
        name: 'John',
        email: 'email@test.com',
        authProvider: 'GOOGLE'
      })).resolves.toEqual(expect.objectContaining({
        id: '1',
        name: 'name',
        email: 'test@test.com',
        phone: null,
        role: 'CLIENT',
        businessId: null,
        createdAt: new Date,
        authProvider: 'GOOGLE',
      }))
    })
  })
  describe('login', () => {
    it('should throw Unauthorized Exception if email is not valid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', password: '123456789', authProvider: 'LOCAL' } as any)
      await expect(() => service.login({
        password: '1234567789',
        email: 'email@test.com',
      })).rejects.toThrow(UnauthorizedException)
    })
    it('should throw NotFoundException if user do not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(() => service.login({
        password: '1234567789',
        email: 'email@test.com',
      })).rejects.toThrow(NotFoundException)
    })
    it('should throw UnauthorizedException if user is not local', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', password: '123456789', authProvider: 'GOOGLE' } as any)
      await expect(() => service.login({
        password: '123456789',
        email: 'email@test.com',
      })).rejects.toThrow(UnauthorizedException)
    })
    it('should throw UnauthorizedException if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', password: '123456789' } as any)
      await expect(() => service.login({
        password: '123456778',
        email: 'email@test.com',
      })).rejects.toThrow(UnauthorizedException)
    })
    it('should return code 200 success login', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'John',
        email: 'email@test.com',
        password: 'hashedpassword',
        authProvider: 'LOCAL',
        role: 'CLIENT',
        phone: null,
        businessId: null,
        createdAt: new Date(),
      } as any)
      const bcrypt = require('bcrypt')
      bcrypt.compare.mockResolvedValue(true)
      let jwt = module.get<any>(JwtService)
      jwt.sign.mockReturnValue('fake-token')
      await expect(service.login({
        password: '1234567789',
        email: 'email@test.com',
      })).resolves.toEqual(expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({ email: 'email@test.com' })
      }))
    })
  })
});

