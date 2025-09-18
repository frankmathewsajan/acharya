import { ApiResponse } from '@/lib/api/types';

/**
 * Extracts data from API response, handling both paginated and direct responses
 * @param response - The API response object
 * @returns The extracted data array or object
 */
export function extractApiData<T>(response: ApiResponse<T>): T {
  if (!response.data) {
    return [] as unknown as T;
  }

  // If data is an array, return it directly
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // If data has results property (paginated response), return results
  if (typeof response.data === 'object' && 'results' in response.data) {
    return (response.data as any).results;
  }

  // Otherwise return data directly
  return response.data;
}

/**
 * Safely extracts results from fulfilled promise results
 * @param promiseResult - The settled promise result
 * @returns The extracted data or empty array on failure
 */
export function extractPromiseData<T>(
  promiseResult: PromiseSettledResult<ApiResponse<T>>
): T {
  if (promiseResult.status === 'fulfilled') {
    return extractApiData(promiseResult.value);
  }
  return [] as unknown as T;
}

/**
 * Checks if an API response indicates success
 * @param response - The API response object
 * @returns True if the response indicates success
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): boolean {
  return response.success === true;
}

/**
 * Extracts error message from API response
 * @param error - The error response object
 * @returns Human-readable error message
 */
export function extractErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}