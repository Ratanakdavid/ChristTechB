import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async checkout(userId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const cartItems = await manager.find(CartItem, {
        where: { userId },
        relations: { product: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Validate stock for everything before touching anything
      for (const item of cartItems) {
        if (item.quantity > item.product.stock) {
          throw new BadRequestException(
            `${item.product.name} only has ${item.product.stock} in stock`,
          );
        }
      }

      let total = 0;
      const orderItems: OrderItem[] = [];

      for (const item of cartItems) {
        const lineTotal = Number(item.product.price) * item.quantity;
        total += lineTotal;

        const orderItem = manager.create(OrderItem, {
          productId: item.product.id,
          productName: item.product.name,
          priceAtPurchase: item.product.price,
          quantity: item.quantity,
        });
        orderItems.push(orderItem);

        // Decrement stock
        await manager.decrement(
          Product,
          { id: item.product.id },
          'stock',
          item.quantity,
        );
      }

      const order = manager.create(Order, {
        userId,
        total,
        status: OrderStatus.PENDING,
        items: orderItems,
      });
      const saved = await manager.save(order);

      // Clear the cart
      await manager.delete(CartItem, { userId });

      return saved;
    });
  }

  findAllForUser(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: { items: true },
      order: { id: 'DESC' },
    });
  }

  findAllForAdmin(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: { items: true, user: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId?: number): Promise<Order> {
    const where = userId ? { id, userId } : { id };
    const order = await this.ordersRepository.findOne({
      where,
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    return this.ordersRepository.save(order);
  }
}
