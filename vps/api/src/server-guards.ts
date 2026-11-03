import type { Server } from "node:http";

export const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

export function isRequestBodyTooLarge(contentLength: string | undefined, receivedBytes: number): boolean {
  const declaredBytes = contentLength === undefined ? Number.NaN : Number(contentLength);
  return (Number.isFinite(declaredBytes) && declaredBytes > MAX_REQUEST_BODY_BYTES)
    || receivedBytes > MAX_REQUEST_BODY_BYTES;
}

export function configureApiServerTimeouts(server: Server): void {
  server.requestTimeout = 35_000;
  server.headersTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  server.setTimeout(30_000, socket => socket.destroy());
}
