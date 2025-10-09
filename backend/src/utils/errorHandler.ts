import { Response } from 'express';

export interface StandardError {
  error: string;
  code?: string;
  details?: any;
}

export const sendError = (
  res: Response, 
  statusCode: number, 
  message: string, 
  code?: string, 
  details?: any
): Response => {
  const errorResponse: StandardError = {
    error: message,
    ...(code && { code }),
    ...(details && { details })
  };
  
  console.error(`HTTP ${statusCode}: ${message}`, { code, details });
  return res.status(statusCode).json(errorResponse);
};

export const sendValidationError = (res: Response, message: string, details?: any): Response => {
  return sendError(res, 400, message, 'VALIDATION_ERROR', details);
};

export const sendNotFoundError = (res: Response, resource: string): Response => {
  return sendError(res, 404, `${resource} not found`, 'NOT_FOUND');
};

export const sendUnauthorizedError = (res: Response, message: string = 'Unauthorized'): Response => {
  return sendError(res, 401, message, 'UNAUTHORIZED');
};

export const sendForbiddenError = (res: Response, message: string = 'Forbidden'): Response => {
  return sendError(res, 403, message, 'FORBIDDEN');
};

export const sendServerError = (res: Response, message: string = 'Internal server error'): Response => {
  return sendError(res, 500, message, 'INTERNAL_ERROR');
};

export const sendConflictError = (res: Response, message: string, details?: any): Response => {
  return sendError(res, 409, message, 'CONFLICT', details);
};