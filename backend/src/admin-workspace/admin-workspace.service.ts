import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Artist } from '../artists/entities/artist.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { ArtistsService } from '../artists/artists.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/enums/audit-action.enum';
import { AuditTargetType } from '../audit-log/enums/audit-target-type.enum';
import {
  orderItemAuditContext,
  productAuditContext,
} from '../audit-log/utils/audit-log-context.util';
import { OrderItemStatus } from '../common/enums/order-status.enum';
import { normalizeRomanianPhone } from '../common/utils/phone.util';
import { AdminTableRevision } from './entities/admin-table-revision.entity';
import { AdminTableCursor } from './entities/admin-table-cursor.entity';
import { ApplyTableEditDto } from './dto/apply-table-edit.dto';
import {
  AdminTableKey,
  MAX_TABLE_REVISIONS,
  TableEditKind,
  assertEditKind,
  assertTableKey,
  composeDeliveryAddress,
  normalizeTableFieldValue,
  sequencesToDrop,
  valuesMatch,
} from './table-edit.util';

const SEARCH_LIMIT = 8;

export type AdminSearchHit = {
  type: 'customer' | 'order' | 'product' | 'artist';
  id: number;
  title: string;
  subtitle: string;
  path: string;
};

export type AdminTableHistory = {
  cursor: number;
  baseline: number;
  limit: number;
  canUndo: boolean;
  canRedo: boolean;
  revisions: Array<{
    sequence: number;
    summary: string;
    field: string;
    fieldLabel: string;
    rowLabel: string;
    previousValue: string | number | boolean | null;
    nextValue: string | number | boolean | null;
    createdAt: Date;
  }>;
};

@Injectable()
export class AdminWorkspaceService {
  constructor(
    @InjectRepository(AdminTableRevision)
    private readonly revisionsRepository: Repository<AdminTableRevision>,
    @InjectRepository(AdminTableCursor)
    private readonly cursorsRepository: Repository<AdminTableCursor>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    private readonly dataSource: DataSource,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly artistsService: ArtistsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async search(user: User, rawQuery: string) {
    const term = rawQuery?.trim() ?? '';
    if (term.length < 2) {
      return { customers: [], orders: [], products: [], artists: [] };
    }

    const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
    const artistId = await this.artistScopeId(user);

    const [customers, orders, products, artists] = await Promise.all([
      user.role === UserRole.SUPER_ADMIN ? this.searchCustomers(like) : Promise.resolve([]),
      this.searchOrders(like, artistId),
      this.searchProducts(like, artistId),
      user.role === UserRole.SUPER_ADMIN ? this.searchArtists(like) : Promise.resolve([]),
    ]);

    return { customers, orders, products, artists };
  }

  async getHistory(user: User, rawTableKey: string): Promise<AdminTableHistory> {
    const tableKey = assertTableKey(rawTableKey);
    this.assertCanUseTable(user, tableKey);
    return this.buildHistory(user.id, tableKey);
  }

  async applyEdit(
    user: User,
    rawTableKey: string,
    dto: ApplyTableEditDto,
  ): Promise<AdminTableHistory> {
    const tableKey = assertTableKey(rawTableKey);
    this.assertCanUseTable(user, tableKey);
    const kind = assertEditKind(tableKey, dto.kind);
    const previousValue = normalizeTableFieldValue(dto.field, dto.previousValue);
    const nextValue = normalizeTableFieldValue(dto.field, dto.nextValue);
    if (valuesMatch(dto.field, previousValue, nextValue)) {
      throw new BadRequestException('No changes to save');
    }

    await this.writeField(user, kind, dto.targetId, dto.field, previousValue, nextValue, false);
    try {
      await this.pushRevision(user.id, tableKey, {
      summary: this.summary(dto.rowLabel, dto.fieldLabel),
      kind,
      targetId: dto.targetId,
      field: dto.field,
      fieldLabel: dto.fieldLabel.trim().slice(0, 80),
      rowLabel: dto.rowLabel.trim().slice(0, 200),
      previousValue,
      nextValue,
    });
    } catch (error) {
      await this.writeField(user, kind, dto.targetId, dto.field, nextValue, previousValue, true);
      throw error;
    }

    return this.buildHistory(user.id, tableKey);
  }

  async undo(user: User, rawTableKey: string): Promise<AdminTableHistory> {
    const tableKey = assertTableKey(rawTableKey);
    this.assertCanUseTable(user, tableKey);
    const revision = await this.revisionAtCursor(user.id, tableKey);
    if (!revision) {
      throw new BadRequestException('Nothing to undo');
    }

    await this.writeField(
      user,
      revision.kind as TableEditKind,
      revision.targetId,
      revision.field,
      revision.nextValue,
      revision.previousValue,
      true,
    );
    await this.setCursor(user.id, tableKey, revision.sequence - 1);
    return this.buildHistory(user.id, tableKey);
  }

  async redo(user: User, rawTableKey: string): Promise<AdminTableHistory> {
    const tableKey = assertTableKey(rawTableKey);
    this.assertCanUseTable(user, tableKey);
    const cursor = await this.cursorValue(user.id, tableKey);
    const revision = await this.revisionsRepository.findOne({
      where: { userId: user.id, tableKey, sequence: cursor + 1 },
    });
    if (!revision) {
      throw new BadRequestException('Nothing to redo');
    }

    await this.writeField(
      user,
      revision.kind as TableEditKind,
      revision.targetId,
      revision.field,
      revision.previousValue,
      revision.nextValue,
      true,
    );
    await this.setCursor(user.id, tableKey, revision.sequence);
    return this.buildHistory(user.id, tableKey);
  }

  async restore(
    user: User,
    rawTableKey: string,
    sequence: number,
  ): Promise<AdminTableHistory> {
    const tableKey = assertTableKey(rawTableKey);
    this.assertCanUseTable(user, tableKey);
    let history = await this.buildHistory(user.id, tableKey);
    if (sequence > history.cursor && !history.revisions.some((item) => item.sequence >= sequence)) {
      throw new BadRequestException('That version is no longer available');
    }
    if (sequence < history.baseline) {
      throw new BadRequestException('That version is no longer available');
    }

    let guard = 0;
    while (history.cursor > sequence && guard < MAX_TABLE_REVISIONS) {
      history = await this.undo(user, tableKey);
      guard += 1;
    }
    while (history.cursor < sequence && guard < MAX_TABLE_REVISIONS * 2) {
      history = await this.redo(user, tableKey);
      guard += 1;
    }
    if (history.cursor !== sequence) {
      throw new BadRequestException('That version is no longer available');
    }
    return history;
  }

  private async searchCustomers(like: string): Promise<AdminSearchHit[]> {
    const buyerIds = await this.customerUserIds();
    const usersQuery = this.usersRepository.createQueryBuilder('user');
    if (buyerIds.length) {
      usersQuery.where('(user.role = :role OR user.id IN (:...buyerIds))', {
        role: UserRole.CLIENT,
        buyerIds,
      });
    } else {
      usersQuery.where('user.role = :role', { role: UserRole.CLIENT });
    }
    const users = await usersQuery
      .andWhere(
        `(user.first_name ILIKE :like OR user.last_name ILIKE :like OR user.email ILIKE :like OR COALESCE(user.phone, '') ILIKE :like OR CONCAT(user.first_name, ' ', user.last_name) ILIKE :like)`,
        { like },
      )
      .orderBy('user.last_name', 'ASC')
      .take(SEARCH_LIMIT)
      .getMany();

    return users.map((user) => ({
      type: 'customer' as const,
      id: user.id,
      title: `${user.first_name} ${user.last_name}`.trim(),
      subtitle: user.email,
      path: `/admin/clienti/${user.id}`,
    }));
  }

  private async searchOrders(like: string, artistId: number | null): Promise<AdminSearchHit[]> {
    const qb = this.ordersRepository
      .createQueryBuilder('ord')
      .leftJoin('ord.items', 'item')
      .where(
        `(ord.publicOrderNumber ILIKE :like
          OR ord.customerFirstName ILIKE :like
          OR ord.customerLastName ILIKE :like
          OR CONCAT(ord.customerFirstName, ' ', ord.customerLastName) ILIKE :like
          OR ord.customerEmail ILIKE :like
          OR ord.customerPhone ILIKE :like
          OR item.title ILIKE :like
          OR item.artistDisplayName ILIKE :like)`,
        { like },
      )
      .orderBy('ord.createdAt', 'DESC')
      .take(40);

    if (artistId) {
      qb.andWhere('item.artistId = :artistId', { artistId });
    }

    const orders = await qb.getMany();
    const uniqueOrders: Order[] = [];
    const seenOrderIds = new Set<number>();
    for (const order of orders) {
      if (seenOrderIds.has(order.id)) continue;
      seenOrderIds.add(order.id);
      uniqueOrders.push(order);
      if (uniqueOrders.length === SEARCH_LIMIT) break;
    }
    return uniqueOrders.map((order) => ({
      type: 'order' as const,
      id: order.id,
      title: order.publicOrderNumber,
      subtitle: `${order.customerFirstName} ${order.customerLastName}`.trim(),
      path: `/admin/comenzi?q=${encodeURIComponent(order.publicOrderNumber)}`,
    }));
  }

  private async searchProducts(like: string, artistId: number | null): Promise<AdminSearchHit[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.artist', 'artist')
      .where(
        `(product.title ILIKE :like OR product.category ILIKE :like OR artist.displayName ILIKE :like)`,
        { like },
      )
      .orderBy('product.updatedAt', 'DESC')
      .take(SEARCH_LIMIT);

    if (artistId) {
      qb.andWhere('product.artistId = :artistId', { artistId });
    }

    const products = await qb.getMany();
    return products.map((product) => ({
      type: 'product' as const,
      id: product.id,
      title: product.title,
      subtitle: product.artist?.displayName || product.category,
      path: `/admin/produse/${product.id}/detalii`,
    }));
  }

  private async searchArtists(like: string): Promise<AdminSearchHit[]> {
    const artists = await this.artistsRepository
      .createQueryBuilder('artist')
      .leftJoinAndSelect('artist.user', 'user')
      .where(
        `(artist.displayName ILIKE :like
          OR COALESCE(artist.contactEmail, '') ILIKE :like
          OR COALESCE(artist.brand, '') ILIKE :like
          OR COALESCE(user.email, '') ILIKE :like
          OR COALESCE(user.first_name, '') ILIKE :like
          OR COALESCE(user.last_name, '') ILIKE :like)`,
        { like },
      )
      .orderBy('artist.displayName', 'ASC')
      .take(SEARCH_LIMIT)
      .getMany();

    return artists.map((artist) => ({
      type: 'artist' as const,
      id: artist.id,
      title: artist.displayName,
      subtitle: artist.user?.email || artist.contactEmail || artist.slug,
      path: `/admin/artisti/${artist.id}`,
    }));
  }

  private async customerUserIds(): Promise<number[]> {
    const rows = await this.ordersRepository
      .createQueryBuilder('ord')
      .select('ord.userId', 'userId')
      .where('ord.userId IS NOT NULL')
      .distinct(true)
      .getRawMany<{ userId: string | number }>();
    return rows
      .map((row) => Number(row.userId))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private async artistScopeId(user: User): Promise<number | null> {
    if (user.role !== UserRole.ARTIST) {
      return null;
    }
    const artist = await this.artistsService.findApprovedByUserId(user.id);
    return artist?.id ?? -1;
  }

  private assertCanUseTable(user: User, tableKey: AdminTableKey) {
    if (tableKey === 'admin-customers' && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async writeField(
    user: User,
    kind: TableEditKind,
    targetId: number,
    field: string,
    expectedCurrent: string | number | boolean | null,
    value: string | number | boolean | null,
    fromHistory: boolean,
  ) {
    const allowed: Record<TableEditKind, string[]> = {
      'order-item-status': ['status'],
      'order-delivery': ['deliveryAddress'],
      'product-fields': ['price', 'stockQuantity', 'inStock'],
      'customer-fields': ['first_name', 'last_name', 'phone'],
    };
    if (!allowed[kind].includes(field)) {
      throw new BadRequestException('This field cannot be edited from the table');
    }

    if (kind === 'order-item-status') {
      const existing = await this.orderItemsRepository.findOne({ where: { id: targetId } });
      if (!existing) {
        throw new NotFoundException('Order item not found');
      }
      if (!valuesMatch(field, existing.status, expectedCurrent)) {
        throw new ConflictException('The value changed before it could be saved. Refresh and try again.');
      }
      const item = await this.ordersService.updateItemStatus(
        user,
        targetId,
        this.readStatus(value),
      );
      await this.auditLogService.record(user, {
        action: AuditAction.ORDER_ITEM_STATUS_UPDATED,
        targetType: AuditTargetType.ORDER_ITEM,
        ...orderItemAuditContext(item),
        metadata: {
          status: item.status,
          orderId: item.orderId,
          publicOrderNumber: item.order?.publicOrderNumber ?? null,
          fromHistory,
        },
      });
      return;
    }

    if (kind === 'order-delivery') {
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Insufficient permissions');
      }
      const order = await this.ordersRepository.findOne({ where: { id: targetId } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      const current = composeDeliveryAddress({
        street: order.deliveryStreet,
        city: order.deliveryCity,
        county: order.deliveryCounty,
        postalCode: order.deliveryPostalCode,
      });
      if (!valuesMatch(field, current, expectedCurrent)) {
        throw new ConflictException('The value changed before it could be saved. Refresh and try again.');
      }
      order.deliveryStreet = String(value ?? '').trim();
      order.deliveryCity = '';
      order.deliveryCounty = '';
      order.deliveryPostalCode = '';
      await this.ordersRepository.save(order);
      await this.auditLogService.record(user, {
        action: AuditAction.ORDER_DELIVERY_UPDATED,
        targetType: AuditTargetType.ORDER,
        targetId: order.id,
        targetLabel: order.publicOrderNumber,
        metadata: { field, fromHistory },
      });
      return;
    }

    if (kind === 'product-fields') {
      const product = await this.productsService.findOneForAdmin(user, targetId);
      const current = product[field as 'price' | 'stockQuantity' | 'inStock'];
      if (!valuesMatch(field, current, expectedCurrent)) {
        throw new ConflictException('The value changed before it could be saved. Refresh and try again.');
      }
      const patch =
        field === 'price'
          ? { price: value as number }
          : field === 'stockQuantity'
            ? { stockQuantity: value as number }
            : { inStock: value as boolean };
      const saved = await this.productsService.updateCatalogFields(user, targetId, patch);
      const fresh = await this.productsService.findOneForAdmin(user, saved.id);
      await this.auditLogService.record(user, {
        action: AuditAction.PRODUCT_UPDATED,
        targetType: AuditTargetType.PRODUCT,
        ...productAuditContext(fresh),
        metadata: { field, value, fromHistory },
      });
      return;
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const customer = await this.usersService.findOne(targetId);
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    const current = customer[field as 'first_name' | 'last_name' | 'phone'];
    if (!valuesMatch(field, current, expectedCurrent)) {
      throw new ConflictException('The value changed before it could be saved. Refresh and try again.');
    }

    const phone =
      field === 'phone'
        ? value === null
          ? null
          : normalizeRomanianPhone(String(value))
        : undefined;
    if (field === 'phone' && value !== null && !phone) {
      throw new BadRequestException('Invalid phone number');
    }

    const saved = await this.usersService.updateClientContact(targetId, {
      ...(field === 'first_name' ? { first_name: String(value) } : {}),
      ...(field === 'last_name' ? { last_name: String(value) } : {}),
      ...(field === 'phone' ? { phone } : {}),
    });

    await this.auditLogService.record(user, {
      action: AuditAction.CUSTOMER_UPDATED,
      targetType: AuditTargetType.CUSTOMER,
      targetId: saved.id,
      targetLabel: `${saved.first_name} ${saved.last_name}`.trim(),
      metadata: { field, fromHistory },
    });
  }

  private readStatus(value: string | number | boolean | null): OrderItemStatus {
    if (typeof value !== 'string' || !Object.values(OrderItemStatus).includes(value as OrderItemStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    return value as OrderItemStatus;
  }

  private async pushRevision(
    userId: number,
    tableKey: AdminTableKey,
    data: Omit<AdminTableRevision, 'id' | 'userId' | 'tableKey' | 'sequence' | 'createdAt'>,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const cursors = manager.getRepository(AdminTableCursor);
      let cursorRow = await cursors.findOne({
        where: { userId, tableKey },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cursorRow) {
        try {
          cursorRow = await cursors.save(cursors.create({ userId, tableKey, cursor: 0 }));
        } catch {
          cursorRow = await cursors.findOne({
            where: { userId, tableKey },
            lock: { mode: 'pessimistic_write' },
          });
        }
      }
      if (!cursorRow) {
        throw new ConflictException('Could not save the table version');
      }

      await manager.delete(AdminTableRevision, {
        userId,
        tableKey,
        sequence: MoreThan(cursorRow.cursor),
      });

      const sequence = cursorRow.cursor + 1;
      await manager.save(
        manager.create(AdminTableRevision, {
          ...data,
          userId,
          tableKey,
          sequence,
        }),
      );
      cursorRow.cursor = sequence;
      await cursors.save(cursorRow);

      const stored = await manager.find(AdminTableRevision, {
        where: { userId, tableKey },
        select: { id: true, sequence: true },
      });
      const drop = sequencesToDrop(stored.map((item) => item.sequence));
      if (drop.length) {
        await manager.delete(AdminTableRevision, {
          userId,
          tableKey,
          sequence: In(drop),
        });
      }
    });
  }

  private async revisionAtCursor(userId: number, tableKey: string) {
    const cursor = await this.cursorValue(userId, tableKey);
    if (cursor <= 0) {
      return null;
    }
    return this.revisionsRepository.findOne({
      where: { userId, tableKey, sequence: cursor },
    });
  }

  private async cursorValue(userId: number, tableKey: string) {
    const cursor = await this.cursorsRepository.findOne({ where: { userId, tableKey } });
    return cursor?.cursor ?? 0;
  }

  private async setCursor(userId: number, tableKey: string, cursor: number) {
    await this.cursorsRepository.update({ userId, tableKey }, { cursor });
  }

  private async buildHistory(userId: number, tableKey: string): Promise<AdminTableHistory> {
    const [cursor, revisions] = await Promise.all([
      this.cursorValue(userId, tableKey),
      this.revisionsRepository.find({
        where: { userId, tableKey },
        order: { sequence: 'DESC' },
      }),
    ]);
    const sequences = revisions.map((item) => item.sequence);
    const baseline = sequences.length ? Math.min(...sequences) - 1 : 0;
    return {
      cursor,
      baseline,
      limit: MAX_TABLE_REVISIONS,
      canUndo: revisions.some((item) => item.sequence === cursor),
      canRedo: revisions.some((item) => item.sequence === cursor + 1),
      revisions: revisions.map((item) => ({
        sequence: item.sequence,
        summary: item.summary,
        field: item.field,
        fieldLabel: item.fieldLabel,
        rowLabel: item.rowLabel,
        previousValue: item.previousValue,
        nextValue: item.nextValue,
        createdAt: item.createdAt,
      })),
    };
  }

  private summary(rowLabel: string, fieldLabel: string) {
    return `${rowLabel.trim()}: ${fieldLabel.trim()}`.slice(0, 240);
  }
}
