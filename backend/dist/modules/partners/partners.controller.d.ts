import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { QueryPartnerDto } from './dto/query-partner.dto';
export declare class PartnersController {
    private readonly partnersService;
    constructor(partnersService: PartnersService);
    create(dto: CreatePartnerDto): Promise<{
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
    update(id: number, dto: UpdatePartnerDto): Promise<{
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
    deactivate(id: number): Promise<{
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
    activate(id: number): Promise<{
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
