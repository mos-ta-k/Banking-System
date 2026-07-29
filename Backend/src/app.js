const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const config = require("./config");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

/** routes required */
const healthRoutes = require("./routes/health");
const authRouter = require("../src/routes/auth.routes");
const accountRouter = require("./routes/accounts.routes");
const transcationRoutes = require("./routes/transaction.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/** use routes */
app.use("/health", healthRoutes);
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transactions", transcationRoutes);

// keep these last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
