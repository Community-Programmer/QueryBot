import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/common';

export class BaseController {
  /**
   * Send error response
   */
  protected error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: any
  ): Response {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Async handler wrapper to catch errors
   */
  protected asyncHandler = (fn: Function) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
}