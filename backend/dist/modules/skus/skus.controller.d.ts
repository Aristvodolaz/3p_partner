import { CreateSkuDto } from './dto/create-sku.dto';
import { ImportSkusDto } from './dto/import-skus.dto';
import { QuerySkuDto } from './dto/query-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService } from './skus.service';
export declare class SkusController {
    private readonly skusService;
    constructor(skusService: SkusService);
    getOperations(): import(".prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: number;
        code: string;
        unit: string | null;
        tariff: import("@prisma/client/runtime/library").Decimal | null;
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
                    tariff: import("@prisma/client/runtime/library").Decimal | null;
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
            sumOfSides: import("@prisma/client/runtime/library").Decimal | null;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            clientRequirements: string | null;
            specialMarks: string | null;
            boxQuant: number | null;
            palletQuant: number | null;
            packCostUnit: import("@prisma/client/runtime/library").Decimal | null;
            packCostBox: import("@prisma/client/runtime/library").Decimal | null;
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
                tariff: import("@prisma/client/runtime/library").Decimal | null;
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
        sumOfSides: import("@prisma/client/runtime/library").Decimal | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: import("@prisma/client/runtime/library").Decimal | null;
        packCostBox: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    create(dto: CreateSkuDto): Promise<{
        operations: ({
            operation: {
                name: string;
                id: number;
                code: string;
                unit: string | null;
                tariff: import("@prisma/client/runtime/library").Decimal | null;
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
        sumOfSides: import("@prisma/client/runtime/library").Decimal | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: import("@prisma/client/runtime/library").Decimal | null;
        packCostBox: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    import(dto: ImportSkusDto): Promise<{
        created: number;
        updated: number;
        total: number;
    }>;
    update(id: number, dto: UpdateSkuDto): Promise<{
        operations: ({
            operation: {
                name: string;
                id: number;
                code: string;
                unit: string | null;
                tariff: import("@prisma/client/runtime/library").Decimal | null;
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
        sumOfSides: import("@prisma/client/runtime/library").Decimal | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        clientRequirements: string | null;
        specialMarks: string | null;
        boxQuant: number | null;
        palletQuant: number | null;
        packCostUnit: import("@prisma/client/runtime/library").Decimal | null;
        packCostBox: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    removeAllByPartner(partnerId: number): Promise<{
        deleted: number;
    }>;
    addPhoto(id: number, file: Express.Multer.File): Promise<{
        id: number;
        skuId: number;
        filename: string;
    }>;
    removePhoto(id: number, photoId: number): Promise<{
        deleted: boolean;
    }>;
}
