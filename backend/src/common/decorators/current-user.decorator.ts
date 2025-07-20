import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserPayload {
  userId: number;
  email: string;
}

interface RequestWithUser extends Request {
  user: UserPayload;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    console.log('request', request.user);
    return request.user;
  },
);
