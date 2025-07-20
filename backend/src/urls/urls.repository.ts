import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';

export interface UpdateUrlData {
  title?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: Date;
}

@Injectable()
export class UrlsRepository {
  constructor(
    @InjectModel(Url)
    private readonly urlModel: typeof Url,
  ) {}

  /**
   * Create a new URL
   */
  create(data: CreateUrlDto, userId: number): Promise<Url> {
    return this.urlModel
      .create({
        ...data,
        userId,
      })
      .then((url) => url.toJSON());
  }

  /**
   * Find a URL by ID
   */
  findById(id: number, userId: number): Promise<Url | null> {
    return this.urlModel.findOne({
      where: { id, userId },
    });
  }

  /**
   * Find a URL by slug
   */
  findBySlug(slug: string): Promise<Url | null> {
    return this.urlModel.findOne({
      where: { slug },
    });
  }

  /**
   * Find all URLs for a user
   */
  findAll(userId: number): Promise<Url[]> {
    return this.urlModel
      .findAll({
        where: {
          userId,
        },
      })
      .then((urls) => urls.map((url) => url.toJSON()));
  }

  /**
   * Update visit statistics
   */
  async updateVisitStats(id: number): Promise<number> {
    const [affectedCount] = await this.urlModel.update(
      {
        visitCount: this.urlModel.sequelize?.literal('visit_count + 1'),
        lastVisitedAt: new Date(),
      },
      {
        where: { id },
      },
    );
    return affectedCount;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<number> {
    const [affectedCount] = await this.urlModel.update(
      { lastLoginAt: new Date() },
      {
        where: { id },
      },
    );
    return affectedCount;
  }
}
