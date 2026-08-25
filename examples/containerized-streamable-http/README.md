# Containerized Streamable HTTP MCP server

This minimal example connects GitHub Copilot Desktop or Copilot CLI to an MCP
server running in a local container. It exposes stateless, JSON-only Streamable
HTTP at `POST /mcp`, plus a separate `GET /health` endpoint.

The server provides two schema-validated tools:

- `echo` returns a non-empty `text` argument unchanged.
- `server_info` reports the server name, version, and transport.

## Eight-step demo

1. **Open this repository in GitHub Copilot Desktop.** The repository-level
   [`.github/mcp.json`](../../.github/mcp.json) registers the
   `containerized-streamable-http` server at
   `http://127.0.0.1:3000/mcp`.
2. **Choose a container engine.** Install Docker or Podman and confirm it is
   running with `docker version` or `podman version`.
3. **Build the image.** From this directory, run
   `docker build -t copilot-mcp-demo .` (or
   `podman build -t copilot-mcp-demo .`). Expect the build to finish
   successfully with a local image named `copilot-mcp-demo`.
4. **Start the server on loopback only.** Run
   `docker run --rm --name copilot-mcp-demo -p 127.0.0.1:3000:3000 copilot-mcp-demo`
   (replace `docker` with `podman` if needed). Expect a message ending in
   `http://0.0.0.0:3000/mcp`.
5. **Check health in another terminal.** Run
   `curl -i http://127.0.0.1:3000/health`. Expect HTTP `200` and
   `{"status":"ok"}`.
6. **Confirm browser-style MCP access is rejected.** Run
   `curl -i http://127.0.0.1:3000/mcp`. Expect HTTP `405`, an `Allow: POST`
   header, and a JSON-RPC error.
7. **Start a fresh Copilot session.** Approve the repository MCP server if
   prompted, then ask: `Use server_info and tell me which transport the local
   server uses.` Expect Copilot to invoke `server_info` and report
   `streamable-http`.
8. **Invoke the second tool.** Ask: `Use echo to repeat "Hello from Copilot".`
   Expect the exact text `Hello from Copilot`.

Copilot CLI reads the same repository configuration. Run `copilot` from the
repository root after starting the container, then use the prompts in steps 7
and 8.

## Develop and validate

Node.js 22 or later is recommended.

```console
npm ci
npm run lint
npm test
npm run build
```

To run without a container:

```console
npm run build
HOST=127.0.0.1 npm start
```

`HOST`, `PORT`, and a comma-separated `ALLOWED_ORIGINS` can be set with
environment variables. Requests without an `Origin` header are accepted for
non-browser MCP clients; supplied origins must be explicitly allowed.

## Troubleshooting

- **Copilot cannot find the tools:** keep the container running, open the
  repository root (not only this directory), and start a fresh Copilot session.
- **Port 3000 is already allocated:** stop the process using it. The checked-in
  MCP URL expects local port 3000.
- **HTTP 403 from `/mcp`:** add the exact trusted origin to
  `ALLOWED_ORIGINS`; do not use `*`.
- **Container health is `unhealthy`:** inspect
  `docker logs copilot-mcp-demo` or `podman logs copilot-mcp-demo`.
- **Podman cannot bind the port:** on SELinux systems, confirm the user-mode
  networking setup and that port 3000 is available.

## Cleanup

Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the foreground container terminal. If it
was detached, run `docker stop copilot-mcp-demo` or
`podman stop copilot-mcp-demo`. Optionally remove the image with
`docker image rm copilot-mcp-demo` or `podman image rm copilot-mcp-demo`.

## Production security

This server is intentionally a local demonstration, not a production
deployment. The loopback-only publish prevents direct access from other hosts,
and the container runs as the non-root `node` user. For production, place MCP
behind TLS and authentication, authorize every tool call, restrict hosts and
origins, rate-limit requests, validate all inputs, avoid returning secrets, log
security events, pin and scan images and dependencies, and keep the service on
a private network. Never publish this unauthenticated demo with
`-p 3000:3000`.
