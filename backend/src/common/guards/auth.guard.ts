import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { verifyToken } from '../../utils/auth.util';

interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload = verifyToken(token);
      request.user = payload;
    } catch (error) {
      console.log('error', error);
      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
