const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

require("./db/knex");
const app = express();
const errorHandler = require("./middleware/errorHandler");
const port = Number(process.env.PORT ?? 3000);

const { router: usersRouter } = require("./routes/usersRoute");
const { router: fabricRouter } = require("./routes/fabricRoute");
const { router: peerRouter } = require("./routes/peerRoute");
const { router: disposableRouter } = require("./routes/disposableEmailRoute");

app.get("/api/v1/", (_request, response) => {
  response.json({ ok: true, service: "linaw-backend" });
});

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? ["http://localhost:5173"],
  }),
);

app.use(express.json());

app.use("/api/v1", usersRouter);
// register disposable-email before fabric router so it isn't intercepted by fabric's auth middleware
app.use("/api/v1/disposable-email", disposableRouter);
app.use("/api/v1", fabricRouter);
app.use("/api/v2/fabric", peerRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express running on port ${port}`);
});

/*
    Needs asynchronous initialization if a local
    or cloud database is connected to any server
    functions to ensure that the database is
    ready before the server
    - Jed
*/
