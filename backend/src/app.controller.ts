import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { APP_URL } from './config/config';

@Controller()
export class AppController {
  @Get('/health')
  health(): string {
    return 'OK';
  }

  @Get(':slug')
  redirectToUrl(@Param('slug') slug: string, @Res() res: Response) {
    const fullUrl = `${APP_URL}/${slug}`;
    return res.redirect(HttpStatus.FOUND, fullUrl);
  }
}
