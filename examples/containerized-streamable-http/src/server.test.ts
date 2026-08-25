import type { AddressInfo } from "node:net";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createHttpServer, SERVER_NAME, SERVER_VERSION } from "./server.js";

describe("containerized Streamable HTTP server", () => {
  let baseUrl: URL;
  let server: ReturnType<typeof createHttpServer>;

  beforeEach(async () => {
    server = createHttpServer();
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address() as AddressInfo;
    baseUrl = new URL(`http://127.0.0.1:${address.port}`);
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it("reports health separately from MCP", async () => {
    const response = await fetch(new URL("/health", baseUrl));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("rejects browser-style GET requests to /mcp", async () => {
    const response = await fetch(new URL("/mcp", baseUrl));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("rejects an untrusted Origin", async () => {
    const response = await fetch(new URL("/mcp", baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://example.invalid",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(403);
  });

  it("uses JSON-only Streamable HTTP responses", async () => {
    const response = await fetch(new URL("/mcp", baseUrl), {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("publishes validated schemas for both tools", async () => {
    const { client, transport } = await connectClient(baseUrl);
    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "echo",
      "server_info",
    ]);
    expect(result.tools[0]?.inputSchema).toMatchObject({
      type: "object",
      required: ["text"],
      properties: { text: { type: "string", minLength: 1 } },
    });
    expect(result.tools[1]?.inputSchema).toMatchObject({
      type: "object",
      properties: {},
    });

    await client.close();
    await transport.close();
  });

  it("invokes echo and server_info", async () => {
    const { client, transport } = await connectClient(baseUrl);

    const echo = await client.callTool({
      name: "echo",
      arguments: { text: "Hello from Copilot" },
    });
    expect(echo.content).toEqual([
      { type: "text", text: "Hello from Copilot" },
    ]);

    const info = await client.callTool({
      name: "server_info",
      arguments: {},
    });
    expect(info.content).toEqual([
      {
        type: "text",
        text: JSON.stringify({
          name: SERVER_NAME,
          version: SERVER_VERSION,
          transport: "streamable-http",
        }),
      },
    ]);

    await client.close();
    await transport.close();
  });
});

async function connectClient(baseUrl: URL): Promise<{
  client: Client;
  transport: StreamableHTTPClientTransport;
}> {
  const client = new Client({ name: "test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("/mcp", baseUrl),
  );
  await client.connect(transport);
  return { client, transport };
}
