import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/auth.entity';

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
}

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    return this.userModel.create(data as any);
  }

  /**
   * Find a user by ID
   */
  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      raw: true,
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<number> {
    const [affectedCount] = await this.userModel.update(
      { lastLoginAt: new Date() },
      {
        where: { id },
      },
    );
    return affectedCount;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.userModel.count({
      where: { email },
    });
    return count > 0;
  }
}
