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
exports.CreateSkuDto = exports.SkuOperationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SkuOperationDto {
}
exports.SkuOperationDto = SkuOperationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Код операции (barcode_check, labeling и т.д.)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SkuOperationDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Значение из шаблона (1, количество и т.п.)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SkuOperationDto.prototype, "value", void 0);
class CreateSkuDto {
}
exports.CreateSkuDto = CreateSkuDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID партнёра' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "partnerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Артикул' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "article", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Штрих-код' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Наименование товара' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Цвет' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Срок годности' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "shelfLife", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Сумма трёх сторон, см (ШДВ)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "sumOfSides", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Вес, кг' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Требования заказчика' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "clientRequirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Специальные отметки (ЧЗ, 18+, хрупкий...)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateSkuDto.prototype, "specialMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Квант коробочный' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "boxQuant", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Квант паллетный' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "palletQuant", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Затраты на допупаковку 1 ед., руб.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "packCostUnit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Затраты на допупаковку 1 короб, руб.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSkuDto.prototype, "packCostBox", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [SkuOperationDto], description: 'Операции по SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SkuOperationDto),
    __metadata("design:type", Array)
], CreateSkuDto.prototype, "operations", void 0);
//# sourceMappingURL=create-sku.dto.js.map