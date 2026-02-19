import {ApiProperty} from "@nestjs/swagger";

class PublicServiceDto {
    @ApiProperty({
        example: "uuid-123456789-1234-5678-1234-567812345678",
        description: "Unique identifier for the service",
    })
    id: string;
    @ApiProperty({
        example: "Corte de cabello",
        description: "Name of the service",
    })
    name: string;
    @ApiProperty({
        example: 25.00,
        description: "Price of the service",
    })
    price: number;
    @ApiProperty({
        example: 30,
        description: "Duration of the service in minutes",
    })
    durationMin: number;
}

export class PublicBusinessDto {
    @ApiProperty({
        example: "uuid-123456789-1234-5678-1234-567812345678",
        description: "Unique identifier for the business",
    })
    id: string;
    @ApiProperty({
        example: "Peluquería Juan",
        description: "Name of the business",
    })
    name: string;
    @ApiProperty({
        type: [PublicServiceDto],
        description: "List of services offered by the business",
    })
    services: PublicServiceDto[];
}