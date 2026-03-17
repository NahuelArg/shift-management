import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';



jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))
describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } }
  let module: TestingModule;

  beforeEach(async () => {
     module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn()
            }
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn()
          }
        },

      ]
    }).compile();
    prisma = module.get<any>(PrismaService)
    service = module.get<AuthService>(AuthService);
  });
  describe('register', () => {
    it('should throw UnauthorizedException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' })
      await expect(() => service.register({
        name: 'JhonDoe',
        email: 'email@test.com'
      })).rejects.toThrow(UnauthorizedException)
    })
    it('should throw BadRequestException if AuthProvider is LOCAL and password is null', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(() => service.register({
        name: 'JhonDoe',
        email: 'email@test.com',
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
        id: 1,
        name: 'name',
        email: 'test@test.com',
        phone: null,
        role: 'CLIENT',
        businessId: null,
        createdAt: expect.any(Date),
        bookings: [],
        authProvider: 'GOOGLE'
      })
      await expect(service.register({
        name: 'John',
        email: 'email@test.com',
        authProvider: 'GOOGLE'
      })).resolves.toEqual(expect.objectContaining({
        id: 1,
        name: 'name',
        email: 'test@test.com',
        phone: null,
        role: 'CLIENT',
        businessId: null,
        createdAt: new Date,
        bookings: [],
        authProvider: 'GOOGLE',
      }))
    })
  })
  describe('login', () => {
    it('should throw UnauthorizedException if email is not valid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com', password: '123456789', authProvider: 'LOCAL' })
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
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com', password: '123456789', authProvider: 'LOCAL' })
      await expect(() => service.login({
        password: '123456789',
        email: 'email@test.com',
      })).rejects.toThrow(UnauthorizedException)
    })
    it('should throw UnauthorizedException if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com', password: '123456789' })
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
        bookings: [],
      })
      const bcrypt = require('bcrypt')
      bcrypt.compare.mockResolvedValue(true)
      let jwt = module.get<any>(JwtService)
      jwt.sign.mockReturnValue('fake-token')
      await expect(service.login({
        password: '1234567789',
        email: 'email@test.com',
      })).resolves.toEqual(expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({email:'email@test.com'})
      }))
    })
  })
});

