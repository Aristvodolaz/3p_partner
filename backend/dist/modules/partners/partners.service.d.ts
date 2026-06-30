import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { QueryPartnerDto } from './dto/query-partner.dto';
export declare class PartnersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePartnerDto, changedBy?: string): Promise<{
        name: string;
        inn: string;
        contractNumber: string;
        contactPerson: string;
        phone: string;
        email: string;
        paymentTerms: string;
        isActive: boolean;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query: QueryPartnerDto): Promise<{
        data: {
            name: string;
            inn: string;
            contractNumber: string;
            contactPerson: string;
            phone: string;
            email: string;
            paymentTerms: string;
            isActive: boolean;
            id: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    findOne(id: number): Promise<{
        name: string;
        inn: string;
        contractNumber: string;
        contactPerson: string;
        phone: string;
        email: string;
        paymentTerms: string;
        isActive: boolean;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, dto: UpdatePartnerDto, changedBy?: string): Promise<{
        name: string;
        inn: string;
        contractNumber: string;
        contactPerson: string;
        phone: string;
        email: string;
        paymentTerms: string;
        isActive: boolean;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivate(id: number, changedBy?: string): Promise<{
        name: string;
        inn: string;
        contractNumber: string;
        contactPerson: string;
        phone: string;
        email: string;
        paymentTerms: string;
        isActive: boolean;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    activate(id: number, changedBy?: string): Promise<{
        name: string;
        inn: string;
        contractNumber: string;
        contactPerson: string;
        phone: string;
        email: string;
        paymentTerms: string;
        isActive: boolean;
        id: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHistory(id: number): Promise<{
        id: number;
        changedBy: string;
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        changedAt: Date;
        partnerId: number;
    }[]>;
}
