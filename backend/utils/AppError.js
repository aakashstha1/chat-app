class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor to set the error message
    super(message);

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Marks this as an expected/operational error
    // rather than an unexpected programming error
    this.isOperational = true;

    // Capture the stack trace and exclude the constructor
    // from the stack trace to make debugging cleaner
    Error.captureStackTrace(this, this.constructor);
  }
}
