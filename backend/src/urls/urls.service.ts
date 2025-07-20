import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UrlsRepository } from './urls.repository';
import { CreateUrlDto } from './dto/create-url.dto';
import { Url } from './entities/url.entity';
import { generateSlug } from '../utils/slug.util';
import { APP_URL } from '../config/config';

@Injectable()
export class UrlsService {
  constructor(private readonly urlsRepository: UrlsRepository) {}

  async createUrl(createUrlDto: CreateUrlDto, userId: number): Promise<Url> {
    if (!createUrlDto.slug) {
      createUrlDto.slug = generateSlug();
    }

    const url = await this.urlsRepository.create(createUrlDto, userId);
    url.slug = `${APP_URL}/${url.slug}`;
    return url;
  }

  async getUrls(userId: number): Promise<Url[]> {
    const urls = await this.urlsRepository.findAll(userId);
    return urls.map((url) => {
      url.slug = `${APP_URL}/${url.slug}`;
      return url;
    });
  }

  async getUrlById(id: string, userId: number): Promise<Url> {
    const url = await this.urlsRepository.findById(Number(id), userId);

    if (!url) {
      throw new ForbiddenException('URL not found');
    }

    return url;
  }

  async redirectToUrl(slug: string): Promise<Url> {
    const url = await this.urlsRepository.findBySlug(slug);

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (!url.isActive) {
      throw new NotFoundException('URL is inactive');
    }

    // Update visit count and last visited timestamp
    await this.urlsRepository.updateVisitStats(url.id);

    return url;
  }
}
