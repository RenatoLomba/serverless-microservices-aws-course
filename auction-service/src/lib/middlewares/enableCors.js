export function enableCors(handler) {
  return async (event, context) => {
    const handlerResult = await handler(event, context);

    return {
      ...handlerResult,
      headers: {
        /* Required for CORS support to work */
        "Access-Control-Allow-Origin": "*",
        /* Required for cookies, authorization headers with HTTPS */
        "Access-Control-Allow-Credentials": true,
      },
    };
  };
}
