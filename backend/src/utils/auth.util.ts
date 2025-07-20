import { User } from '@/auth/entities/auth.entity';
import { UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { verify, sign } from 'jsonwebtoken';

export const checkUserPassword = async (
  password: string,
  hashedPassword: string,
) => {
  const isPasswordValid = await compare(password, hashedPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return isPasswordValid;
};

export const hashPassword = async (password: string) => {
  return await hash(password, 10);
};

export const generateToken = (user: User): string => {
  return sign(
    { userId: Number(user.id), email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    },
  ) as string;
};

type TokenPayload = {
  userId: number;
  email: string;
};

export const verifyToken = (token: string): TokenPayload => {
  return verify(token, process.env.JWT_SECRET) as TokenPayload;
};
