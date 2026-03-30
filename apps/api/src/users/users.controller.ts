import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, ShopScopeGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findPage(
    @Req() req: Request,
    @Query('page') pageStr?: string,
    @Query('size') sizeStr?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(sizeStr ?? '20', 10) || 20));
    return this.usersService.findPage(req.effectiveShopCode!, page, size);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.usersService.findOneForShop(id, req.effectiveShopCode!);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateUserDto) {
    return this.usersService.create({
      ...dto,
      shopCode: req.effectiveShopCode!,
    });
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, req.effectiveShopCode!);
  }
}
