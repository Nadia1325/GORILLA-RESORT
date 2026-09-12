import app from "./app.js";
import { PORT } from "./config/index.js";
import { scheduleWeeklyReport } from "./services/weeklyReport.service.js";

scheduleWeeklyReport();

app.listen(
  PORT,
  () => {
    console.log(
      `Gorilla Resort API running on http://localhost:${PORT}`
    );
  }
);
