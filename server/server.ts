import { createApp } from "./src/app.ts";

const port = Number(process.env["PORT"] ?? 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`Express running on port ${port}`);
});
