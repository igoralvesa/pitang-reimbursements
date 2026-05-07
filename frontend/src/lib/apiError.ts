import axios from 'axios';

const FALLBACK_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorPayload(error: unknown): unknown {
  if (axios.isAxiosError(error)) {
    return error.response?.data;
  }

  return error;
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  const payload = getErrorPayload(error);

  if (!isRecord(payload)) {
    return {};
  }

  return Object.entries(payload).reduce<Record<string, string[]>>((fieldErrors, [key, value]) => {
    if (key === 'message' || !isRecord(value) || !Array.isArray(value.errors)) {
      return fieldErrors;
    }

    const errors = value.errors.filter((item): item is string => typeof item === 'string');

    if (errors.length > 0) {
      fieldErrors[key] = errors;
    }

    return fieldErrors;
  }, {});
}

export function getApiErrorMessage(error: unknown): string {
  const payload = getErrorPayload(error);

  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message;
  }

  const fieldErrors = getApiFieldErrors(error);
  const firstFieldError = Object.values(fieldErrors).find((errors) => errors.length > 0)?.[0];

  return firstFieldError ?? FALLBACK_ERROR_MESSAGE;
}
