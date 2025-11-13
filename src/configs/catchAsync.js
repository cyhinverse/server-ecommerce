const { StatusCodes } = require("http-status-codes");

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error("Async Error:", err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message || "Something went wrong!",
      });
    });
  };
};

module.exports = catchAsync;
