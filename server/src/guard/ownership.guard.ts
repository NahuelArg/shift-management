import{
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {RequestWithUser} from 'src/types/express-request.interface';
import { parseArgs } from 'util';

@Injectable()
export class OwnershipGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const userId = request.user?.userId
        if(!userId){
            throw new ForbiddenException('User not authenticated');
        }
        const resourceOwnerId = this.extractOwnerIdFromRequest(request);
        if(!resourceOwnerId ) throw new BadRequestException('Owner ID not found in request');
        if(userId !== resourceOwnerId) throw new ForbiddenException('User does not own this resource');
    return true;
}
    private extractOwnerIdFromRequest(request: RequestWithUser): string | undefined {
        const {params, query, body} = request
        return(
            params.ownerId??
            params.businessId??
            params.serviceId??
            (query.ownerId as string || undefined) ??
            (query.businessId as string || undefined) ??
            (query.serviceId as string || undefined) ??
            body.ownerId ??
            body.businessId ??
            body.serviceId ??
            undefined
        );
    }
    }
