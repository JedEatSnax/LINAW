const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", networkRoutes);
app.use("/api", monitorRoutes);

app.listen(PORT, () => {
  console.log("listening on port ${PORT}");
});
