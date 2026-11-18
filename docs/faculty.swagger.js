
import {
  createFacultyExample,
  updateFacultyExample,
} from "./examples.js";

const facultyPaths = {
  //==================================================
  // Create / Get All Faculties
  //==================================================

  "/faculties": {
    // Create Faculty

    post: {
      tags: ["Faculty"],
      summary: "Create Faculty",
      description: "Create a new faculty member. Admin only.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateFacultyRequest",
            },
            example: createFacultyExample,
          },
        },
      },

      responses: {
        201: {
          description: "Faculty created successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FacultySuccessResponse",
              },
            },
          },
        },
        400: {
          description: "Validation error or invalid speciality.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Forbidden. Admin access required.",
        },
        409: {
          description: "Faculty email or mobile already exists.",
        },
      },
    },

    // Get All Faculties

    get: {
      tags: ["Faculty"],
      summary: "Get All Faculties",
      description:
        "Get all faculties with pagination, search, filtering, sorting and Redis caching. Admin only.",

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
          description: "Number of records per page.",
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
          name: "sortBy",
          schema: {
            type: "string",
            enum: [
              "fullName",
              "email",
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
          description: "Sorting order.",
        },
        {
          in: "query",
          name: "specialityId",
          schema: {
            type: "string",
            example: "672a12345678901234567890",
          },
          description: "Filter faculties by speciality ID.",
        },
      ],

      responses: {
        200: {
          description: "Faculties fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FacultiesListResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Forbidden. Admin access required.",
        },
        500: {
          description: "Internal server error.",
        },
      },
    },
  },

  //==================================================
  // Get / Update / Delete Faculty By ID
  //==================================================

  "/faculties/{id}": {
    // Get Faculty By ID

    get: {
      tags: ["Faculty"],
      summary: "Get Faculty By ID",
      description: "Get faculty details by ID. Admin only.",

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
          description: "Faculty MongoDB ObjectId.",
        },
      ],

      responses: {
        200: {
          description: "Faculty fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FacultySuccessResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid faculty ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Forbidden.",
        },
        404: {
          description: "Faculty not found.",
        },
      },
    },

    // Update Faculty

    put: {
      tags: ["Faculty"],
      summary: "Update Faculty",
      description: "Update faculty details. Admin only.",

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
          description: "Faculty MongoDB ObjectId.",
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateFacultyRequest",
            },
            example: updateFacultyExample,
          },
        },
      },

      responses: {
        200: {
          description: "Faculty updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FacultySuccessResponse",
              },
            },
          },
        },
        400: {
          description: "Validation error or invalid speciality.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Forbidden.",
        },
        404: {
          description: "Faculty not found.",
        },
        409: {
          description: "Email or mobile already exists.",
        },
      },
    },

    // Delete Faculty

    delete: {
      tags: ["Faculty"],
      summary: "Delete Faculty",
      description: "Delete a faculty member by ID. Admin only.",

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
          description: "Faculty MongoDB ObjectId.",
        },
      ],

      responses: {
        200: {
          description: "Faculty deleted successfully.",
        },
        400: {
          description: "Invalid faculty ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Forbidden.",
        },
        404: {
          description: "Faculty not found.",
        },
      },
    },
  },
};

export default facultyPaths;
