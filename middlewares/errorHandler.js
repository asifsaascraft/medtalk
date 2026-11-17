
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message || err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message || "Something went wrong.",
  });
};

export default errorHandler;
