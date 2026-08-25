import { createServer, type Server } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const SERVER_NAME = "containerized-streamable-http";
export const SERVER_VERSION = "1.0.0";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "echo",
    {
      description: "Return the supplied text unchanged.",
      inputSchema: {
        text: z.string().min(1).describe("Text to echo"),
      },
    },
    async ({ text }) => ({
      content: [{ type: "text", text }],
    }),
  );

  server.registerTool(
    "server_info",
    {
      description: "Return information about this demo server.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: SERVER_NAME,
            version: SERVER_VERSION,
            transport: "streamable-http",
          }),
        },
      ],
    }),
  );

  return server;
}

function allowedOrigins(): Set<string> {
  const configured =
    process.env.ALLOWED_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000";
  return new Set(
    configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function createHttpServer(): Server {
  const app = createMcpExpressApp();
  const origins = allowedOrigins();

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/mcp", (_request, response) => {
    response
      .status(405)
      .set("Allow", "POST")
      .json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
      });
  });

  app.post("/mcp", async (request, response) => {
    const origin = request.get("origin");
    if (origin && !origins.has(origin)) {
      response.status(403).json({ error: "Origin not allowed" });
      return;
    }

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error("Failed to handle MCP request:", error);
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  return createServer(app);
}
