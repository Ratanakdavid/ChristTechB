import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthedRequest {
  user: { userId: number; email: string; role: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req: AuthedRequest) {
    return this.ordersService.checkout(req.user.userId);
  }

  @Get('my')
  findMine(@Req() req: AuthedRequest) {
    return this.ordersService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.role === 'admin' ? undefined : req.user.userId;
    return this.ordersService.findOne(id, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.ordersService.findAllForAdmin();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
