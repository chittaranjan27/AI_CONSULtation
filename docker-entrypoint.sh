#!/bin/sh
set -e

echo "🚀 Starting Brahma Graha Container..."

# Check database connectivity if DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Checking database connectivity..."
  node -e '
  const net = require("net");
  try {
    const rawUrl = process.env.DATABASE_URL;
    const url = new URL(rawUrl);
    const host = url.hostname;
    const port = parseInt(url.port || "5432", 10);
    let attempts = 0;
    const maxAttempts = 15;

    function tryConnect() {
      attempts++;
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.on("connect", () => {
        console.log("✅ Database at " + host + ":" + port + " is reachable!");
        socket.destroy();
        process.exit(0);
      });
      socket.on("error", (err) => {
        socket.destroy();
        if (attempts >= maxAttempts) {
          console.log("⚠️ Database port probe finished (proceeding with startup): " + err.message);
          process.exit(0);
        }
        setTimeout(tryConnect, 1500);
      });
      socket.on("timeout", () => {
        socket.destroy();
        if (attempts >= maxAttempts) {
          console.log("⚠️ Database port probe timed out (proceeding with startup)");
          process.exit(0);
        }
        setTimeout(tryConnect, 1500);
      });
      socket.connect(port, host);
    }
    tryConnect();
  } catch (e) {
    console.log("⚠️ Skipping pre-flight DB probe: " + e.message);
    process.exit(0);
  }
  '
fi

echo "🟢 Launching web application..."
exec "$@"
