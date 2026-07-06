export declare class SkuOperationDto {
    code: string;
    value?: string;
}
export declare class CreateSkuDto {
    partnerId: number;
    article: string;
    barcode?: string;
    name: string;
    color?: string;
    shelfLife?: string;
    sumOfSides?: number;
    weight?: number;
    clientRequirements?: string;
    specialMarks?: string;
    boxQuant?: number;
    palletQuant?: number;
    packCostUnit?: number;
    packCostBox?: number;
    operations?: SkuOperationDto[];
}
