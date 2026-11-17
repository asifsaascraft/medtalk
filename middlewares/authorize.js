
import { errorResponse } from "../utils/response.js";

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

export default authorize;
