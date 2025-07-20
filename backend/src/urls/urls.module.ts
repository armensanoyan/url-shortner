import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Url } from './entities/url.entity';
import { AuthModule } from '@/auth/auth.module';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { UrlsRepository } from './urls.repository';

@Module({
  imports: [SequelizeModule.forFeature([Url]), AuthModule],
  exports: [SequelizeModule],
  providers: [UrlsService, UrlsRepository],
  controllers: [UrlsController],
})
export class UrlsModule {}
