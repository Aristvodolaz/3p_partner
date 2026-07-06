import { CreateSkuDto } from './create-sku.dto';
declare const ImportSkuRowDto_base: import("@nestjs/common").Type<Omit<CreateSkuDto, "partnerId">>;
export declare class ImportSkuRowDto extends ImportSkuRowDto_base {
}
export declare class ImportSkusDto {
    partnerId: number;
    replace?: boolean;
    rows: ImportSkuRowDto[];
}
export {};
