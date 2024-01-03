class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // To ensure that the stack trace starts from where the error was
    // constructed, rather than within the internals of the error object.
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
