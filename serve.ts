import { watch } from "fs";
import type { ServerWebSocket } from "bun";

const clients: Set<ServerWebSocket<unknown>> = new Set();

const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    if (req.headers.get("Upgrade") === "websocket") {
      const upgraded = server.upgrade(req, {
        data: {}, // Initialize with empty data object
      });
      if (upgraded) {
        return undefined;
      }
    }

    // Read the HTML file
    const html = await Bun.file("./exemple/intex.html").text();

    // Replace the jsDelivr CDN link with the local development version
    const modifiedHtml = html.replace(
      "https://cdn.jsdelivr.net/gh/pay-simple/simple@1.1/dist/index.min.js",
      "http://localhost:8000/sdk",
    );

    // Add hot reload script
    const hotReloadScript = `
      <script>
        const ws = new WebSocket('ws://localhost:8000');
        ws.onmessage = () => location.reload();
      </script>
    `;
    const finalHtml = modifiedHtml.replace(
      "</body>",
      `${hotReloadScript}</body>`,
    );

    // Serve the SDK at /sdk endpoint
    if (req.url.endsWith("/sdk")) {
      return new Response(await Bun.file("./dist/index.js").text(), {
        headers: { "Content-Type": "text/javascript" },
      });
    }

    return new Response(finalHtml, {
      headers: { "Content-Type": "text/html" },
    });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
    },
    message() {}, // We don't need to handle incoming messages
    close(ws) {
      clients.delete(ws);
    },
  },
});

// Watch for file changes
const watcher = watch("./dist");
watcher.on("change", () => {
  // Notify all clients to reload
  for (const client of clients) {
    client.send("reload");
  }
});

console.info(`Listening on ${server.url}`);
