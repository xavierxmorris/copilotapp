# Demo: local containerized MCP server in GitHub Copilot

This walkthrough demonstrates GitHub Copilot Desktop using tools from an MCP
server running in a local container.

## What this proves

- The MCP server runs as a non-root process in Docker or Podman.
- The host publishes the service only on `127.0.0.1:3000`.
- Copilot connects to `http://127.0.0.1:3000/mcp`.
- MCP uses stateless, JSON-only Streamable HTTP: no stdio, no legacy HTTP+SSE,
  and no SSE response streams.
- Copilot can discover and invoke the `echo` and `server_info` tools.

```text
GitHub Copilot Desktop
        |
        | Streamable HTTP
        v
http://127.0.0.1:3000/mcp
        |
        v
Local container: containerized-mcp-example
```

## Prerequisites

- GitHub Copilot Desktop with access to MCP servers
- Docker Desktop or Podman
- Git

If an organization manages your Copilot account, its MCP policy and allowlist
must permit repository or user-defined MCP servers.

## 1. Clone and open the repository

```shell
git clone https://github.com/xavierxmorris/copilotapp.git
cd copilotapp
```

The repository includes [`.github/mcp.json`](../../.github/mcp.json), so a
trusted Copilot project session automatically discovers the demo server.

## 2. Build the container

With Docker:

```shell
docker build -t copilot-mcp-example ./examples/containerized-mcp
```

Or with Podman:

```shell
podman build -t copilot-mcp-example ./examples/containerized-mcp
```

## 3. Start the server on loopback only

With Docker:

```shell
docker run --rm -d --name copilot-mcp-example -p 127.0.0.1:3000:3000 copilot-mcp-example
```

Or with Podman:

```shell
podman run --rm -d --name copilot-mcp-example -p 127.0.0.1:3000:3000 copilot-mcp-example
```

The application binds to `0.0.0.0` inside the container, while the publish
option restricts host access to `127.0.0.1`.

## 4. Verify health

PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

macOS or Linux:

```shell
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "name": "containerized-mcp-example",
  "version": "1.0.0",
  "transport": "Streamable HTTP"
}
```

Do not use `GET /mcp` as a health check. It intentionally returns
`405 Method Not Allowed` because this stateless server accepts MCP messages
through `POST /mcp`.

## 5. Connect GitHub Copilot Desktop

1. Open this repository as a project in GitHub Copilot Desktop.
2. Trust the project when prompted.
3. Start a **new** project session after the container is running. Existing
   sessions do not reload their MCP tool catalog.
4. Ask Copilot:

   ```text
   Use the containerized-mcp-example server_info tool and show the exact result.
   ```

Expected tool result:

```json
{
  "name": "containerized-mcp-example",
  "version": "1.0.0",
  "transport": "Streamable HTTP"
}
```

## 6. Invoke the echo tool

Ask Copilot:

```text
Use the containerized-mcp-example echo tool with exactly "hello from Copilot Desktop".
```

Expected result:

```text
hello from Copilot Desktop
```

The repository allowlists only `echo` and `server_info`:

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

## 7. Optional: verify with Copilot CLI

Copilot Desktop and Copilot CLI use the same project MCP configuration format.
From the repository root:

```shell
copilot mcp get containerized-mcp-example
```

Then launch `copilot` and invoke the same two tools, or run:

```shell
copilot -p "Call containerized-mcp-example server_info, then echo with exactly cli-client-ok." --allow-all-tools
```

## 8. Stop the demo

With Docker:

```shell
docker stop copilot-mcp-example
```

Or with Podman:

```shell
podman stop copilot-mcp-example
```

Because the container was started with `--rm`, it is removed automatically.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Copilot does not list the tools | Confirm the container is healthy, trust the project, then start a new Copilot session. |
| MCP content is blocked by an IT administrator | Ask the organization administrator to enable MCP and allow this server/configuration source. |
| Port 3000 is already in use | Stop the conflicting process or publish a different loopback port and update `.github/mcp.json` to match. |
| `GET /mcp` returns 405 | Expected. Use `/health` for health checks; MCP clients use `POST /mcp`. |
| Copilot cannot connect from a remote/cloud session | `127.0.0.1` refers to that remote environment, not your laptop. This demo targets local Desktop/CLI sessions. |

## Verified result

On 2026-08-07, a fresh GitHub Copilot Desktop-managed project session connected
to the running container and returned:

```text
server_info -> {"name":"containerized-mcp-example","version":"1.0.0","transport":"Streamable HTTP"}
echo("desktop-app-client-ok") -> desktop-app-client-ok
```

For production or shared use, add HTTPS, OAuth-based authentication and
authorization, deployment-specific Origin validation, managed secrets, and
network restrictions.
