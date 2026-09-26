const { AppError } = require('../domain/appError');

function notFoundHandler(req, res, next) {
  next(new AppError(404, 'route_not_found', `No route for ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof SyntaxError && err.status === 400 && Object.hasOwn(err, 'body')) {
    res.status(400).json({
      error: {
        code: 'invalid_json',
        message: 'Request body must be valid JSON',
      },
    });
    return;
  }

  const statusCode = err.isOperational ? err.statusCode : 500;
  const payload = {
    error: {
      code: err.isOperational ? err.code : 'internal_error',
      message: err.isOperational ? err.message : 'Unexpected server error',
    },
  };

  if (err.isOperational && err.details) payload.error.details = err.details;

  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    payload.error.stack = err.stack;
    console.error(err);
  } else if (!err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
