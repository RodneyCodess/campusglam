import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health";
import { providersRouter } from "./routes/providers";
import { usersRouter } from "./routes/users";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use(healthRouter);
app.use(usersRouter);
app.use(providersRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
