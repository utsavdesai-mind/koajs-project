const Koa = require("koa");
const multer = require("@koa/multer");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const mount = require("koa-mount");
const path = require("path");
const apiRoutes = require("./src/routes/apiRoutes");
const connectDB = require("./src/config/db");

// Create the main Koa app that handles every incoming request.
const app = new Koa();

// Connect to MongoDB before the server starts serving API traffic.
connectDB();

// Expose frontend assets and uploaded images as static files.
app.use(serve(path.join(__dirname, "public")));
app.use(mount("/uploads", serve(path.join(__dirname, "uploads"))));


const { errorResponse } = require("./src/utils/response");

// Catch application, validation, and upload errors in one shared place.
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        // Return a friendly message when the uploaded file is too large.
        return errorResponse(ctx, "Image must be smaller than 2MB", 400, err);
      }

      return errorResponse(ctx, "Image upload failed", 400, err);
    }

    // Return a clear validation error when the uploaded file type is not allowed.
    if (err.message === "Unsupported file format. Only JPEG, JPG, PNG, and WEBP are allowed.") {
      return errorResponse(ctx, err.message, 400, err);
    }

    // Fall back to a generic error response for all unexpected exceptions.
    errorResponse(ctx, err.message || "Internal Server Error", err.status || 500, err);
  }
});


// Parse JSON request bodies so controllers can read ctx.request.body.
app.use(bodyParser());

// Register the versioned API routes on the app.
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

const PORT = process.env.PORT || 3000;

// Start listening for HTTP requests on the configured port.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});