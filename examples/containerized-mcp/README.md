# Containerized MCP Streamable HTTP example

This minimal TypeScript server uses the official MCP SDK and exposes:

- `POST /mcp`: stateless, JSON-only MCP Streamable HTTP transport
- `GET /health`: container and process health
- `echo`: returns validated text unchanged
- `server_info`: returns the server name, version, and transport

The transport does not expose stdio or the legacy HTTP+SSE transport, and
Streamable HTTP responses use JSON rather than SSE streams. `GET /mcp`
intentionally returns `405 Method Not Allowed`; it is not a browser page or
health check.

For a presenter-friendly, end-to-end walkthrough, see
[DEMO.md](DEMO.md).

## Versions

The dependencies are pinned to versions current on 2026-08-07:

| Package | Version |
| --- | --- |
| Node.js container image | 24.13.0 |
| `@modelcontextprotocol/sdk` | 1.30.0 |
| `express` | 5.2.1 |
| `zod` | 4.4.3 |
| `typescript` | 7.0.2 |
| `vitest` | 4.1.10 |

Sources:

- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Streamable HTTP specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http)
- [GitHub Copilot CLI MCP configuration](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)
- [Official Node.js container image](https://hub.docker.com/_/node)

## Install and test

From `examples/containerized-mcp`:

```shell
npm install
npm run lint
npm test
npm run build
```

Run without a container:

```shell
npm start
```

The local process defaults to `127.0.0.1:3000`. The container overrides the
bind address to `0.0.0.0` so port publishing works.

## Build and run with Docker

From the repository root:

```shell
docker build -t copilot-mcp-example ./examples/containerized-mcp
docker run --rm -d --name copilot-mcp-example-docker \
  -p 127.0.0.1:3000:3000 copilot-mcp-example
curl http://127.0.0.1:3000/health
docker stop copilot-mcp-example-docker
```

## Build and run with Podman

From the repository root:

```shell
podman build -t copilot-mcp-example ./examples/containerized-mcp
podman run --rm -d --name copilot-mcp-example-podman \
  -p 127.0.0.1:3000:3000 copilot-mcp-example
curl http://127.0.0.1:3000/health
podman stop copilot-mcp-example-podman
```

Publishing to `127.0.0.1` is deliberate: it keeps the unauthenticated example
off other host interfaces.

## Configure GitHub Copilot CLI

This repository includes [`.github/mcp.json`](../../.github/mcp.json), a
supported shared repository-level configuration. Start the container, launch
Copilot CLI from this trusted repository, and the server is discovered as
`containerized-mcp-example`.

If Copilot reports that MCP content is blocked by an IT administrator, the
organization or enterprise MCP policy/allowlist must permit this server before
Copilot can load it.

For user-wide configuration, add this entry to
`~/.copilot/mcp-config.json` (or `$COPILOT_HOME/mcp-config.json`):

```json
{
  "mcpServers": {
    "containerized-mcp-example": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp",
      "tools": ["echo", "server_info"]
    }
  }
}
```

Alternatively, add it with the supported CLI command:

```shell
copilot mcp add --transport http --tools echo,server_info \
  containerized-mcp-example http://127.0.0.1:3000/mcp
```

Inside Copilot CLI, verify discovery with:

```text
/mcp show containerized-mcp-example
```

Then invoke both tools with prompts such as:

```text
Use the containerized-mcp-example echo tool with the text "hello MCP".
Use the containerized-mcp-example server_info tool and show its result.
```

The same configuration is supported by the GitHub Copilot desktop app. Start a
new desktop project session after adding or changing MCP configuration, because
an already-running session does not reload its tool catalog. This example was
verified from a fresh desktop-managed session: `server_info` returned the
expected server metadata and `echo` returned `desktop-app-client-ok`.

## Deployment boundary

This is a local demonstration, not a production deployment. A production or
shared server needs HTTPS, authentication and authorization (typically OAuth),
deployment-specific Origin validation, managed secrets, and network access
restrictions. Keep the tool allowlist narrow and do not put credentials in MCP
configuration files.

## Current upstream advisories

As of 2026-08-07, `npm audit` reports
[GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)
and
[GHSA-8j4g-w8fx-2239](https://github.com/advisories/GHSA-8j4g-w8fx-2239)
through the current MCP SDK dependency graph. The patched `fast-uri` release
named in its advisory was not yet available from npm during validation, and
the available automatic fix downgrades the MCP SDK. This example therefore
keeps the required current SDK version. Re-run `npm audit` and update patched
transitive releases before any production deployment.
