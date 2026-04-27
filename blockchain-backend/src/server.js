import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
  express.json(),
);

app.use("/api/v1", apiRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
