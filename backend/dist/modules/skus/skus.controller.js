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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkusController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const create_sku_dto_1 = require("./dto/create-sku.dto");
const import_skus_dto_1 = require("./dto/import-skus.dto");
const query_sku_dto_1 = require("./dto/query-sku.dto");
const update_sku_dto_1 = require("./dto/update-sku.dto");
const skus_service_1 = require("./skus.service");
const photoStorage = (0, multer_1.diskStorage)({
    destination: skus_service_1.UPLOADS_DIR,
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `sku-${unique}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
    },
});
let SkusController = class SkusController {
    constructor(skusService) {
        this.skusService = skusService;
    }
    getOperations() {
        return this.skusService.getOperations();
    }
    findAll(query) {
        return this.skusService.findAll(query);
    }
    findOne(id) {
        return this.skusService.findOne(id);
    }
    create(dto) {
        return this.skusService.create(dto);
    }
    import(dto) {
        return this.skusService.import(dto);
    }
    update(id, dto) {
        return this.skusService.update(id, dto);
    }
    remove(id) {
        return this.skusService.remove(id);
    }
    removeAllByPartner(partnerId) {
        return this.skusService.removeAllByPartner(partnerId);
    }
    addPhoto(id, file) {
        if (!file)
            throw new common_1.BadRequestException('Файл не передан');
        return this.skusService.addPhoto(id, file.filename);
    }
    removePhoto(id, photoId) {
        return this.skusService.removePhoto(id, photoId);
    }
};
exports.SkusController = SkusController;
__decorate([
    (0, common_1.Get)('operations'),
    (0, swagger_1.ApiOperation)({ summary: 'Каталог операций с тарифами' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "getOperations", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список SKU с фильтром по партнёру и поиском' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Список SKU' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sku_dto_1.QuerySkuDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить SKU по ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать карточку SKU' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'SKU создан' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sku_dto_1.CreateSkuDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, swagger_1.ApiOperation)({
        summary: 'Массовый импорт SKU из Excel (замена или дозагрузка)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_skus_dto_1.ImportSkusDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "import", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Редактировать SKU (атрибуты и операции)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_sku_dto_1.UpdateSkuDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить SKU' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Полное удаление справочника партнёра' }),
    __param(0, (0, common_1.Query)('partnerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "removeAllByPartner", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, swagger_1.ApiOperation)({ summary: 'Загрузить фото SKU (до 3 штук)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: photoStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
            cb(ok ? null : new common_1.BadRequestException('Допустимы только изображения (jpg, png, webp, gif)'), ok);
        },
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "addPhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photos/:photoId'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить фото SKU' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('photoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "removePhoto", null);
exports.SkusController = SkusController = __decorate([
    (0, swagger_1.ApiTags)('Справочник SKU'),
    (0, common_1.Controller)('skus'),
    __metadata("design:paramtypes", [skus_service_1.SkusService])
], SkusController);
//# sourceMappingURL=skus.controller.js.map