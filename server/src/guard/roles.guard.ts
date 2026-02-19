import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from 'src/types/express-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('User or user role is not defined');
    }

    return requiredRoles.includes(user.role);
  }
}
