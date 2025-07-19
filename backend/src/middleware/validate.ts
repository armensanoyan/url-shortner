import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      const validatedData = await schema.parseAsync(req.body);
      
      // Replace request body with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        console.log({error: error.issues});
        const formattedErrors = (error as any).issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
}; 