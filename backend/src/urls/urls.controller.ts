import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../common/decorators/current-user.decorator';

@Controller('api/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @UseGuards(AuthGuard)
  createUrl(
    @Body() createUrlDto: CreateUrlDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.urlsService.createUrl(createUrlDto, user.userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  getUrls(@CurrentUser() user: UserPayload) {
    return this.urlsService.getUrls(user.userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getUrlById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.urlsService.getUrlById(id, user.userId);
  }
}
