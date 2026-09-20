export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "crypto-api"
      });
    }

    return Response.json({
      status: "ok",
      service: "crypto-api",
      message: "Crypto API is running"
    });
  }
};
