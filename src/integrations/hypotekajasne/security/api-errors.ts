/**
 * Typed partner API errors — distinguish transient vs permanent failures.
 */

export class HypotekaJasneApiError extends Error {
  readonly httpStatus: number | null;
  readonly code: string;
  readonly retryable: boolean;

  constructor(input: {
    message: string;
    httpStatus?: number | null;
    code?: string;
    retryable?: boolean;
  }) {
    super(input.message);
    this.name = "HypotekaJasneApiError";
    this.httpStatus = input.httpStatus ?? null;
    this.code = input.code ?? "PARTNER_API_ERROR";
    this.retryable =
      input.retryable ?? isRetryableHttpStatus(input.httpStatus ?? null);
  }
}

export function isRetryableHttpStatus(status: number | null): boolean {
  if (status == null) return true;
  if (status === 408 || status === 429) return true;
  if (status >= 500) return true;
  return false;
}

export function classifyFetchError(error: unknown): HypotekaJasneApiError {
  if (error instanceof HypotekaJasneApiError) return error;
  return new HypotekaJasneApiError({
    message: error instanceof Error ? error.message : "Network error",
    httpStatus: null,
    code: "NETWORK_ERROR",
    retryable: true,
  });
}

export function hypotekaJasneApiErrorFromResponse(input: {
  status: number;
  statusText: string;
}): HypotekaJasneApiError {
  return new HypotekaJasneApiError({
    message: `HypotekaJasne API ${input.status}: ${input.statusText}`,
    httpStatus: input.status,
    code: `HTTP_${input.status}`,
    retryable: isRetryableHttpStatus(input.status),
  });
}
