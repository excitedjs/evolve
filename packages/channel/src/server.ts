import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { handleResponses } from "./handler";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function createChannelServer(port: number) {
  const server = createServer(async (req, res) => {
    cors(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/v1/responses") {
      try {
        const body = JSON.parse(await readBody(req));
        await handleResponses(body, res);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message, type: "invalid_request_error" } }));
      }
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "Not found", type: "not_found" } }));
  });

  server.listen(port, () => {
    process.stdout.write(`[channel] OpenResponses server listening on :${port}\n`);
  });

  return server;
}
