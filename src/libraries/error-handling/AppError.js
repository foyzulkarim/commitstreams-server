class AppError extends Error {
  constructor(name, message, HTTPStatus = 500, isTrusted = true, cause = null) {
    super(message);
    this.name = name;
    this.message = message;
    this.HTTPStatus = HTTPStatus;
    this.isTrusted = isTrusted;
    this.cause = cause;
  }
}

class ValidationError extends AppError {
  constructor(message, cause = null) {
    super('ValidationError', message, 400, true, cause);
  }
}

module.exports = { AppError, ValidationError };
