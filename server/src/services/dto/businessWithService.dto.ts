import { Service } from '@prisma/client';

export interface BusinessWithServices {
    name: string;
    services: Service[];
}