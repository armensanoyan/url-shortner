import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty()
  @IsString()
  originalUrl: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;
}
