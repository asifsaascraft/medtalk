
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserSession from "../models/UserSession.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/response.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Authorization Header

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Not authorized. Please login.",
    });
  }

  // Verify Access Token

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return errorResponse(res, {
      statusCode: 401,
      message:
        error.name === "TokenExpiredError"
          ? "Access token expired. Please refresh your session."
          : "Invalid access token.",
    });
  }

  // Validate Token Payload

  if (!decoded.id || !decoded.sessionId) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid authentication token.",
    });
  }

  // Find Session

  const session = await UserSession.findOne({
    sessionId: decoded.sessionId,
    user: decoded.id,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Session expired or logged out. Please login again.",
    });
  }

  // Find User

  const user = await User.findById(decoded.id);

  if (!user) {
    return errorResponse(res, {
      statusCode: 401,
      message: "User account not found.",
    });
  }

  if (user.status !== "active") {
    return errorResponse(res, {
      statusCode: 403,
      message: "Your account is not active.",
    });
  }

  // Verify Role

  if (user.role !== decoded.role) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Authentication information is invalid.",
    });
  }

  // Check Password Changed

  if (user.changedPasswordAfter(decoded.iat)) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Password changed. Please login again.",
    });
  }

  // Update Activity

  await session.touch();

  // Attach User and Session

  req.user = user;
  req.session = session;

  next();
});

export default protect;
