import { NextResponse } from 'next/server';

/**
 * Standard API error codes
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'VERSION_CONFLICT'
  | 'DUPLICATE_ENTRY'
  | 'INTERNAL_ERROR';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  VERSION_CONFLICT: 409,
  DUPLICATE_ENTRY: 409,
  INTERNAL_ERROR: 500,
};

/**
 * Create a standardized API error response.
 *
 * @example
 * // Simple error
 * return apiError('NOT_FOUND', 'Note not found');
 *
 * // With details
 * return apiError('VALIDATION_ERROR', 'Invalid input', {
 *   field: 'email',
 *   constraint: 'email_format'
 * });
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const status = ERROR_STATUS_MAP[code];

  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Shorthand error creators
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') => apiError('UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => apiError('FORBIDDEN', message),
  notFound: (resource = 'Resource') => apiError('NOT_FOUND', `${resource} not found`),
  validation: (message: string, details?: Record<string, unknown>) =>
    apiError('VALIDATION_ERROR', message, details),
  versionConflict: (currentVersion: number, requestedVersion: number) =>
    apiError(
      'VERSION_CONFLICT',
      'This resource has been modified. Please refresh and try again.',
      { currentVersion, requestedVersion }
    ),
  duplicate: (resource: string, field = 'name') =>
    apiError('DUPLICATE_ENTRY', `${resource} with this ${field} already exists`),
  internal: (message = 'Internal server error') => apiError('INTERNAL_ERROR', message),
};
