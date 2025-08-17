import express from "express";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
import userRouter  from "./routes/userRouter.js";
import villaRouter  from "./routes/villaRouter.js";
import paymentCategoryRouter from "./routes/paymentCategoryRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import expenseRouter from "./routes/expenseRouter.js";
import reportRouter from "./routes/reportRoutes.js";
import dashboardRouter from "./routes/dashboardRouter.js";
import backupRouter from "./routes/backupRouter.js";

const PORT = process.env.PORT || 5000;
dotenv.config();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/villas", villaRouter);
app.use("/api/payment-categories", paymentCategoryRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/reports", reportRouter);
app.use("/api/dashboards", dashboardRouter);
app.use("/api/backups", backupRouter);

app.get("/", (req, res) => {
    res.send("Hello Express!");
});

app.listen(PORT, () =>
    console.log(`Server started on http://localhost:${PORT}`)
);
