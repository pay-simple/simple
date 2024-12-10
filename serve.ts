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
    const html = await Bun.file("./exemple/index.html").text();

    // Replace the jsDelivr CDN link with the local development version
    const modifiedHtml = html.replace(
      "https://cdn.jsdelivr.net/gh/pay-simple/simple@1.1/dist/index.min.js",
      "http://localhost:8000/sdk",
    );

    // Add improved hot reload script with reconnection logic
    const hotReloadScript = `
      <script>
        function connectWebSocket() {
          const ws = new WebSocket('ws://localhost:8000');
          
          ws.onmessage = () => {
            console.log('Reloading due to file change...');
            location.reload();
          };

          ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
            setTimeout(connectWebSocket, 1000);
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };
        }
        connectWebSocket();
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

const watcher = watch("./example", { recursive: true });

watcher.on("change", (_, filename) => handleFileChange(`example/${filename}`));

function handleFileChange(path: string) {
  console.log(`File changed: ${path}`);
  for (const client of clients) {
    client.send("reload");
  }
}

console.info(`Listening on ${server.url}`);
