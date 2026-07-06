import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthedRequest {
  user: { userId: number; email: string; role: string };
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll(@Req() req: AuthedRequest) {
    return this.cartService.findAll(req.user.userId);
  }

  @Post()
  addItem(@Req() req: AuthedRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @Patch(':id')
  updateQuantity(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeItem(req.user.userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@Req() req: AuthedRequest) {
    return this.cartService.clearCart(req.user.userId);
  }
}
