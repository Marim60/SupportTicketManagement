import { HttpErrorResponse } from '@angular/common/http';

export function ticketError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  switch (error.status) {
    case 0: return 'Could not connect to the API. Check that it is running.';
    case 401: return 'Your session could not be authorized. Sign out and sign in again.';
    case 403: return 'Your account does not have permission to perform this action.';
    case 404: return 'This ticket was not found or is no longer available.';
    default: return fallback;
  }
}

export function validationMessages(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse) || error.status !== 400) return [];
  const errors: unknown = error.error?.errors;
  if (!errors || typeof errors !== 'object') return [];
  // The API groups validation messages by field; collect their text into one list.
  return Object.values(errors).flatMap(value =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  );
}
