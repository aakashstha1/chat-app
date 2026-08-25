import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./configs/db-config.js";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
// initSocket(server);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
