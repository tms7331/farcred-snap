import { serve } from "@hono/node-server";
import app from "./app.js";

const port = parseInt(process.env.PORT ?? "3003", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`FarCred snap running at http://localhost:${port}`);
});
