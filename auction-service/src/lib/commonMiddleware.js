import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import jsonErrorHandler from "middy-middleware-json-error-handler";

export default (handler) =>
  middy(handler).use([
    httpJsonBodyParser(),
    httpEventNormalizer(),
    jsonErrorHandler(),
  ]);
