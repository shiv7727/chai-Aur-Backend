import { ApiError } from "../utils/ApiError.mjs";
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    // If it's an instance of ApiError, handle it specifically
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      // stack: err.stack,
    });
  }
  // If it's a generic error, send a 500 status code and a generic message

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    errors: [
      {
        path: "",
        message: "Something went wrong",
      },
    ],
    stack: err.stack,
  });
};

export { errorHandler };
