import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';
import { checkUserPassword } from 'src/utils/auth.util';
import { hashPassword } from 'src/utils/auth.util';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/auth-response.dto';
import { User } from './entities/auth.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  private transformUser(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  private generateToken(user: User): string {
    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.authRepository.findByEmail(registerDto.email);

    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await hashPassword(registerDto.password);

    const newUser = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.transformUser(newUser);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await checkUserPassword(loginDto.password, user.password);

    // Update last login timestamp
    await this.authRepository.updateLastLogin(user.id);

    return {
      token: this.generateToken(user),
    };
  }
}
