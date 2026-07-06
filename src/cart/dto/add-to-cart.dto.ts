import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;
}
