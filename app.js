const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const mount = require("koa-mount");
const path = require("path");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const connectDB = require("./src/config/db");

const app = new Koa();

// Connect Database
connectDB();

// Serve static files
app.use(serve(path.join(__dirname, "public")));
app.use(mount("/uploads", serve(path.join(__dirname, "uploads"))));


const { errorResponse } = require("./src/utils/response");

// Error Handling Middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    errorResponse(ctx, err.message, err.status || 500, err);
  }
});


// Middleware
app.use(bodyParser());

// Routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});