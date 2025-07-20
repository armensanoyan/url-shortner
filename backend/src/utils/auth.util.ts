import { UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

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
