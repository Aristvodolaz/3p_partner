import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { ImportSkusDto } from './dto/import-skus.dto';
import { QuerySkuDto } from './dto/query-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
export declare const UPLOADS_DIR: string;
export declare class SkusService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOperations(): Prisma.PrismaPromise<{
        name: string;
        id: number;
        code: string;
        unit: string | null;
        tariff: Prisma.Decimal | null;
        sortOrder: number;
    }[]>;
    findAll(query: QuerySkuDto): Promise<{
        data: ({
            operations: ({
                operation: {
                    name: string;
                    id: number;
                    code: string;
                    unit: string | null;
                    tariff: Prisma.Decimal | null;
                    sortOrder: number;
                };
            } & {
                value: string | null;
                id: number;
                operationId: number;
                skuId: number;
            })[];
            photos: {
                id: number;
                skuId: number;
                filename: string;
            }[];
        } & {
            name: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            partnerId: number;
            article: string;
            barcode: string | null;
            color: string | null;
            shelfLife: string | null;
            sumOfSides: Prisma.Decimal | null;
            weight: Prisma.Decimal | null;
            clientRequirements: string | null;
            specialMarks: string | null;
            boxQuant: number | null;
            palletQuant: number | null;
            packCostUnit: Prisma.Decimal | null;
            packCostBox: Prisma.Decimal | null;
        })[];
        total: number;
    }>;
    findOne(id: number): Promise<{
        operations: ({
            operation: {
                name: string;
                id: number;
                code: string;
                unit: string | null;
                tariff: Prisma.Decimal | null;
                sortOrder: number;
            };
        } & {
            value: string | null;
            id: number;
            operationId: number;
            skuId: number;
        })[];
        photos: {
            id: number;
            skuId: number;
            filename: string;
        }[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partnerId: number;
        article: string;
        barcode: string | null;
        color: string | null;
        shelfLife: string | null;
        sumOfSides: Prisma.Decimal | null;
        weight: Prisma.Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: Prisma.Decimal | null;
        packCostBox: Prisma.Decimal | null;
    }>;
    create(dto: CreateSkuDto): Promise<{
        operations: ({
            operation: {
                name: string;
                id: number;
                code: string;
                unit: string | null;
                tariff: Prisma.Decimal | null;
                sortOrder: number;
            };
        } & {
            value: string | null;
            id: number;
            operationId: number;
            skuId: number;
        })[];
        photos: {
            id: number;
            skuId: number;
            filename: string;
        }[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partnerId: number;
        article: string;
        barcode: string | null;
        color: string | null;
        shelfLife: string | null;
        sumOfSides: Prisma.Decimal | null;
        weight: Prisma.Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: Prisma.Decimal | null;
        packCostBox: Prisma.Decimal | null;
    }>;
    update(id: number, dto: UpdateSkuDto): Promise<{
        operations: ({
            operation: {
                name: string;
                id: number;
                code: string;
                unit: string | null;
                tariff: Prisma.Decimal | null;
                sortOrder: number;
            };
        } & {
            value: string | null;
            id: number;
            operationId: number;
            skuId: number;
        })[];
        photos: {
            id: number;
            skuId: number;
            filename: string;
        }[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partnerId: number;
        article: string;
        barcode: string | null;
        color: string | null;
        shelfLife: string | null;
        sumOfSides: Prisma.Decimal | null;
        weight: Prisma.Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: Prisma.Decimal | null;
        packCostBox: Prisma.Decimal | null;
    }>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    removeAllByPartner(partnerId: number): Promise<{
        deleted: number;
    }>;
    import(dto: ImportSkusDto): Promise<{
        created: number;
        updated: number;
        total: number;
    }>;
    addPhoto(id: number, filename: string): Promise<{
        id: number;
        skuId: number;
        filename: string;
    }>;
    removePhoto(id: number, photoId: number): Promise<{
        deleted: boolean;
    }>;
    private buildOperationsCreate;
    private deletePhotoFiles;
}
