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

app.get("/api/v1/", (_request, response) => {
  response.json({ ok: true, service: "linaw-backend" });
});

app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
  express.json(),
);

app.use("/api/v1", usersRouter);
app.use("/api/v1", fabricRouter);
app.use("/api/v1", peerRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express running on port ${port}`);
});
