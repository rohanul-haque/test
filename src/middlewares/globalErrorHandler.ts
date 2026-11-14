import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";

const globalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof TokenExpiredError) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Token has expired. Please login again.",
    });

    return;
  }

  if (error instanceof JsonWebTokenError) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Invalid authentication token.",
    });

    return;
  }

  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join(".") : "unknown",
      message: issue.message,
    }));

    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Validation failed.",
      errors,
    });

    return;
  }

  const err = error as {
    statusCode?: number;
    status?: number;
    message?: string;
    stack?: string;
  };

  const statusCode =
    err.statusCode ?? err.status ?? StatusCodes.INTERNAL_SERVER_ERROR;

  const message = err.message ?? "Internal server error.";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

export default globalErrorHandler;
