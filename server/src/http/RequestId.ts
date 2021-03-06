import { randomBytes } from "crypto";
import * as os from "os";
import { Request, Response, NextFunction } from "express";
import { symbolKeys } from "./constants";

// RequestID is a middleware that injects a request ID into the context of each
// request. A request ID is a string of the form "host.example.com/random-0001",
// where "random" is a base62 random string that uniquely identifies this go
// process, and where the last number is an atomically incremented request
// counter.

export class RequestId {
  id = ++RequestId.id;

  toString(): string {
    return `${RequestId.prefix}-${this.id.toString(10).padStart(6, "0")}`;
  }

  stringify(): string {
    return this.toString();
  }

  toJSON() {
    return this.toString();
  }

  static injectMiddleware(req: Request, res: Response, next: NextFunction) {
    let reqId = new RequestId();
    // @ts-ignore
    req[symbolKeys.requestId] = reqId;
    // @ts-ignore
    res[symbolKeys.requestId] = reqId;
    next();
  }

  static extract(reqOrRes: Request | Response): RequestId {
    // @ts-ignore
    return reqOrRes[symbolKeys.requestId];
  }

  private static hostname = os.hostname() || "localhost";
  private static prefix = `${RequestId.hostname}/${RequestId.startupGuid()}`;
  private static id = 0;

  private static startupGuid(): string {
    let b64 = "";
    // Generate a random base64 string, but reduce it to base 62.
    // This will likely only run once, but if our 2 unwanted chars
    // take up much of our string, this needs to rerun.
    let replacer = /[\+\/]/g;
    while (b64.length < 10) {
      b64 = randomBytes(12)
        .toString("base64")
        .replace(replacer, "");
    }

    return b64.slice(0, 10);
  }
}
