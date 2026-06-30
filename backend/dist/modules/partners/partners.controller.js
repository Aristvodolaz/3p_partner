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
exports.PartnersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const partners_service_1 = require("./partners.service");
const create_partner_dto_1 = require("./dto/create-partner.dto");
const update_partner_dto_1 = require("./dto/update-partner.dto");
const query_partner_dto_1 = require("./dto/query-partner.dto");
let PartnersController = class PartnersController {
    constructor(partnersService) {
        this.partnersService = partnersService;
    }
    create(dto) {
        return this.partnersService.create(dto);
    }
    findAll(query) {
        return this.partnersService.findAll(query);
    }
    findOne(id) {
        return this.partnersService.findOne(id);
    }
    update(id, dto) {
        return this.partnersService.update(id, dto);
    }
    deactivate(id) {
        return this.partnersService.deactivate(id);
    }
    activate(id) {
        return this.partnersService.activate(id);
    }
    getHistory(id) {
        return this.partnersService.getHistory(id);
    }
};
exports.PartnersController = PartnersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать карточку партнёра' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Партнёр успешно создан' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_partner_dto_1.CreatePartnerDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список партнёров с поиском и фильтрацией' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Список партнёров' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_partner_dto_1.QueryPartnerDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить партнёра по ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Редактировать карточку партнёра' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_partner_dto_1.UpdatePartnerDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Деактивировать партнёра (история сохраняется)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Активировать партнёра' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "activate", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, swagger_1.ApiOperation)({ summary: 'История изменений по партнёру' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "getHistory", null);
exports.PartnersController = PartnersController = __decorate([
    (0, swagger_1.ApiTags)('Партнёры'),
    (0, common_1.Controller)('partners'),
    __metadata("design:paramtypes", [partners_service_1.PartnersService])
], PartnersController);
//# sourceMappingURL=partners.controller.js.map