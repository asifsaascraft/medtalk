
import { updateUserProfileExample } from "./examples.js";

//==================================================
// Reusable Swagger Helpers
//==================================================

const jsonRequest = (schema, example) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schema}`,
      },
      example,
    },
  },
});

const response = (description, schema) => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schema}`,
      },
    },
  },
});

//==================================================
// User Management Paths
//==================================================

const userPaths = {
  //==================================================
  // GET ALL USERS WITHOUT PAGINATION
  //==================================================

  "/users": {
    get: {
      tags: ["Users"],
      summary: "Get All Users",
      description:
        "Fetch all registered user accounts without pagination. Admin access only.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: response(
          "Users fetched successfully.",
          "UsersListResponse",
        ),
        401: response(
          "Authentication required.",
          "AuthErrorResponse",
        ),
        403: response(
          "Only admins can access this endpoint.",
          "AuthErrorResponse",
        ),
        500: response(
          "Internal server error.",
          "AuthErrorResponse",
        ),
      },
    },
  },

  //==================================================
  // GET USERS WITH PAGINATION
  //==================================================

  "/users/admin": {
    get: {
      tags: ["Users"],
      summary: "Get Users with Pagination",
      description:
        "Fetch registered users with pagination, search, speciality/status filters, sorting and Redis caching. Admin access only.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            minimum: 1,
            example: 1,
          },
          description: "Page number.",
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 20,
          },
          description: "Number of users per page.",
        },
        {
          in: "query",
          name: "search",
          schema: {
            type: "string",
            example: "Rahul",
          },
          description:
            "Search by full name, email, mobile or affiliation.",
        },
        {
          in: "query",
          name: "specialityId",
          schema: {
            type: "string",
            example: "672a12345678901234567890",
          },
          description: "Filter users by speciality ID.",
        },
        {
          in: "query",
          name: "status",
          schema: {
            type: "string",
            enum: ["pending", "active"],
          },
          description: "Filter users by account status.",
        },
        {
          in: "query",
          name: "sortBy",
          schema: {
            type: "string",
            enum: [
              "fullName",
              "email",
              "mobile",
              "affiliation",
              "createdAt",
              "updatedAt",
            ],
            example: "createdAt",
          },
          description: "Field used for sorting.",
        },
        {
          in: "query",
          name: "order",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            example: "desc",
          },
          description: "Sort order.",
        },
      ],

      responses: {
        200: response(
          "Users fetched successfully.",
          "UsersPaginatedResponse",
        ),
        401: response(
          "Authentication required.",
          "AuthErrorResponse",
        ),
        403: response(
          "Only admins can access this endpoint.",
          "AuthErrorResponse",
        ),
        500: response(
          "Internal server error.",
          "AuthErrorResponse",
        ),
      },
    },
  },

  //==================================================
  // UPDATE USER PROFILE
  //==================================================

  "/users/{id}": {
    patch: {
      tags: ["Users"],
      summary: "Update User Profile",
      description:
        "Update a registered user's profile. All request fields are optional. Only profile fields can be updated. Admin access only.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "MongoDB user ID.",
        },
      ],

      requestBody: jsonRequest(
        "UpdateUserProfileRequest",
        updateUserProfileExample,
      ),

      responses: {
        200: response(
          "User profile updated successfully.",
          "UserProfileSuccessResponse",
        ),
        400: response(
          "Invalid user ID or profile fields.",
          "AuthErrorResponse",
        ),
        401: response(
          "Authentication required.",
          "AuthErrorResponse",
        ),
        403: response(
          "Only admins can update user profiles.",
          "AuthErrorResponse",
        ),
        404: response(
          "User or speciality not found.",
          "AuthErrorResponse",
        ),
        409: response(
          "Email or mobile number is already registered.",
          "AuthErrorResponse",
        ),
        500: response(
          "Internal server error.",
          "AuthErrorResponse",
        ),
      },
    },
  },
};

export default userPaths;
