"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportSkusDto = exports.ImportSkuRowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const create_sku_dto_1 = require("./create-sku.dto");
class ImportSkuRowDto extends (0, swagger_2.OmitType)(create_sku_dto_1.CreateSkuDto, [
    'partnerId',
]) {
}
exports.ImportSkuRowDto = ImportSkuRowDto;
class ImportSkusDto {
}
exports.ImportSkusDto = ImportSkusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID партнёра' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ImportSkusDto.prototype, "partnerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'true — полная замена справочника партнёра, false — дозагрузка/обновление',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportSkusDto.prototype, "replace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ImportSkuRowDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ImportSkuRowDto),
    __metadata("design:type", Array)
], ImportSkusDto.prototype, "rows", void 0);
//# sourceMappingURL=import-skus.dto.js.map