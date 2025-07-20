import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Url } from './entities/url.entity';

@Module({
  imports: [SequelizeModule.forFeature([Url])],
  exports: [SequelizeModule],
})
export class UrlsModule {}
