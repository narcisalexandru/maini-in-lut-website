import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { SaveProductDraftDto } from './dto/save-product-draft.dto';
import { RejectProductDto } from './dto/reject-product.dto';
import { ReviewProductChangesDto } from './dto/review-product-changes.dto';
import { RejectProposalDto } from './dto/propose-product-changes.dto';
import { ProductStatus } from '../common/enums/product-status.enum';
import { toAdminProductResponse } from './utils/product-response.util';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/enums/audit-action.enum';
import { AuditTargetType } from '../audit-log/enums/audit-target-type.enum';
import { productAuditContext } from '../audit-log/utils/audit-log-context.util';

class ListProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistId?: number;
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get('review-queue')
  async findReviewQueue() {
    const products = await this.productsService.findReviewQueue();
    return Promise.all(
      products.map(async (product) =>
        toAdminProductResponse(
          product,
          await this.productsService.getPendingProposal(product.id),
        ),
      ),
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListProductsQueryDto,
  ) {
    const products = await this.productsService.findAllForAdmin(
      req.user,
      query.status,
      query.artistId,
    );
    return Promise.all(
      products.map(async (product) =>
        toAdminProductResponse(
          product,
          await this.productsService.getPendingProposal(product.id),
        ),
      ),
    );
  }

  @Roles(UserRole.ARTIST)
  @Get('active-draft')
  async findActiveDraft(@Request() req: AuthenticatedRequest) {
    const product = await this.productsService.findActiveDraftForArtist(
      req.user.id,
    );
    if (!product) {
      return null;
    }
    const pendingProposal = await this.productsService.getPendingProposal(
      product.id,
    );
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.ARTIST)
  @Put('draft')
  async saveDraft(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveProductDraftDto,
  ) {
    const product = await this.productsService.saveDraftForArtist(
      req.user.id,
      dto,
    );
    const pendingProposal = await this.productsService.getPendingProposal(
      product.id,
    );
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Get(':id')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.findOneForAdmin(req.user, id);
    const pendingProposal = await this.productsService.getPendingProposal(id);
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.ARTIST)
  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.productsService.createForArtist(
      req.user.id,
      dto,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_CREATED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateProductDto,
  ) {
    const product =
      req.user.role === UserRole.SUPER_ADMIN
        ? await this.productsService.updateForSuperAdmin(
            req.user.id,
            id,
            dto,
          )
        : await this.productsService.updateForArtist(
            req.user.id,
            id,
            dto,
          );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_UPDATED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.ARTIST)
  @Delete(':id/draft')
  async deleteDraft(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.productsService.deleteDraftForArtist(req.user.id, id);
    return { success: true };
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Delete(':id')
  async deleteProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.findOneForAdmin(req.user, id);
    await this.productsService.deleteForAdmin(req.user, id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_DELETED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(product),
    });
    return { success: true };
  }

  @Roles(UserRole.ARTIST)
  @Post(':id/submit-changes')
  async submitChanges(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.submitChangeRequestForArtist(
      req.user.id,
      id,
      dto,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_SUBMITTED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
      metadata: { changeRequest: true, changes: dto },
    });
    const pendingProposal = await this.productsService.getPendingProposal(id);
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.ARTIST)
  @Post(':id/submit')
  async submit(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.submitForReview(req.user.id, id);
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_SUBMITTED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/review-changes')
  async reviewChanges(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewProductChangesDto,
  ) {
    const product = await this.productsService.reviewProductChanges(
      id,
      req.user.id,
      dto.action,
      dto.fields,
      dto.reason,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_UPDATED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
      metadata: {
        reviewAction: dto.action,
        fields: dto.fields ?? null,
        reason: dto.reason?.trim() || null,
      },
    });
    const pendingProposal = await this.productsService.getPendingProposal(id);
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.approve(id, req.user.id);
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_APPROVED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/reject')
  async reject(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProductDto,
  ) {
    const product = await this.productsService.reject(
      id,
      req.user.id,
      dto.reason,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_REJECTED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
      metadata: { reason: dto.reason.trim() },
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/propose-changes')
  async proposeChanges(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.proposeChanges(
      id,
      req.user.id,
      dto,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_CHANGES_PROPOSED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
      metadata: { changes: dto },
    });
    const pendingProposal = await this.productsService.getPendingProposal(id);
    return toAdminProductResponse(product, pendingProposal);
  }

  @Roles(UserRole.ARTIST)
  @Post(':id/accept-changes')
  async acceptChanges(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.acceptChanges(req.user.id, id);
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_CHANGES_ACCEPTED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
    });
    return toAdminProductResponse(product);
  }

  @Roles(UserRole.ARTIST)
  @Post(':id/reject-changes')
  async rejectChanges(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProposalDto,
  ) {
    const product = await this.productsService.rejectChanges(
      req.user.id,
      id,
      dto.message,
    );
    const withArtist = await this.productsService.findOneForAdmin(req.user, product.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.PRODUCT_CHANGES_REJECTED,
      targetType: AuditTargetType.PRODUCT,
      ...productAuditContext(withArtist),
      metadata: dto.message ? { message: dto.message } : null,
    });
    return toAdminProductResponse(product);
  }
}
