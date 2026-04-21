const Koa = require("koa");
const multer = require("@koa/multer");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const mount = require("koa-mount");
const path = require("path");
const apiRoutes = require("./src/routes/apiRoutes");
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
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return errorResponse(ctx, "Image must be smaller than 2MB", 400, err);
      }

      return errorResponse(ctx, "Image upload failed", 400, err);
    }

    if (err.message === "Unsupported file format. Only JPEG, JPG, PNG, and WEBP are allowed.") {
      return errorResponse(ctx, err.message, 400, err);
    }

    errorResponse(ctx, err.message || "Internal Server Error", err.status || 500, err);
  }
});


// Middleware
app.use(bodyParser());

// Routes
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});