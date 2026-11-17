import createClient from "openapi-fetch";
import type { paths, components } from "./schema";

export type ApiWorkspace = components["schemas"]["Workspace"];
export type BrowserImport = components["schemas"]["ImportPayload"];
export type ApiSolution = components["schemas"]["SolutionView"];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const api = createClient<paths>({
  headers: { "X-Patterna-Request": "1" },
});
api.use({
  async onResponse({ response }) {
    if (response.ok) return;
    const body: unknown = await response
      .clone()
      .json()
      .catch(() => null);
    const detail =
      body && typeof body === "object" && "detail" in body ? body.detail : null;
    const message =
      typeof detail === "string"
        ? detail
        : response.status === 422
          ? "Check the required fields, dates and text lengths."
          : "Patterna could not complete the request.";
    throw new ApiError(
      response.status,
      response.status >= 500 && response.status !== 503
        ? "Patterna is temporarily unavailable. Try again."
        : message,
    );
  },
});

export function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "The server could not be reached. Try again.";
}
