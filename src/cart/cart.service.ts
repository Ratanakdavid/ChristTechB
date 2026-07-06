import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  findAll(userId: number): Promise<CartItem[]> {
    return this.cartRepository.find({
      where: { userId },
      relations: { product: true },
      order: { id: 'DESC' },
    });
  }

  async addItem(userId: number, dto: AddToCartDto): Promise<CartItem> {
    const product = await this.productsService.findOne(dto.productId);
    const quantity = dto.quantity ?? 1;

    if (quantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} in stock`);
    }

    const existing = await this.cartRepository.findOne({
      where: { userId, productId: dto.productId },
    });

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} in stock`);
      }
      existing.quantity = newQuantity;
      return this.cartRepository.save(existing);
    }

    const item = this.cartRepository.create({
      userId,
      productId: dto.productId,
      quantity,
    });
    return this.cartRepository.save(item);
  }

  async updateQuantity(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
      relations: { product: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(`Only ${item.product.stock} in stock`);
    }

    item.quantity = dto.quantity;
    return this.cartRepository.save(item);
  }

  async removeItem(userId: number, itemId: number): Promise<void> {
    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.cartRepository.remove(item);
  }

  async clearCart(userId: number): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}
