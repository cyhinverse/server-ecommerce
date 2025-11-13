const app = require("./app");
const connectDB = require("./db/connect.db");
const dotenv = require("dotenv");
dotenv.config();
const cluster = require("cluster");

const PORT = process.env.PORT || 3000;

const startServer = () => {
  connectDB()
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.error("Failed to connect to the database:", error);
    });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

if (cluster.isPrimary) {
  const worker = 6;
  for (let i = 0; i < worker; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new worker.`);
    cluster.fork();
  });
} else {
  startServer();
}
