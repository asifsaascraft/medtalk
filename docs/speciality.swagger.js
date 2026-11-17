import {
  createSpecialityExample,
  updateSpecialityExample,
} from "./examples.js";

const specialityPaths = {
  //==============================
  // Create Speciality
  //==============================
  "/specialities": {
    post: {
      tags: ["Speciality"],

      summary: "Create Speciality",

      description: "Create a new speciality. Admin and staff only.",

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
              $ref: "#/components/schemas/CreateSpecialityRequest",
            },

            example: createSpecialityExample,
          },
        },
      },

      responses: {
        201: {
          description: "Speciality created successfully.",
        },

        400: {
          description: "Validation error.",
        },

        401: {
          description: "Unauthorized.",
        },

        403: {
          description: "Forbidden.",
        },

        409: {
          description: "Speciality already exists.",
        },
      },
    },

    //==============================
    // Get Specialities
    //==============================
    get: {
      tags: ["Speciality"],

      summary: "Get Specialities",

      description:
        "Public API. Fetch all specialities for the user registration dropdown.",

      parameters: [
        {
          in: "query",

          name: "search",

          schema: {
            type: "string",
          },

          description: "Search specialities by speciality name.",
        },

        {
          in: "query",

          name: "sortBy",

          schema: {
            type: "string",
            example: "specialityName",
          },

          description: "Field to sort by.",
        },

        {
          in: "query",

          name: "order",

          schema: {
            type: "string",
            enum: ["asc", "desc"],
            example: "asc",
          },

          description: "Sorting order.",
        },
      ],

      responses: {
        200: {
          description: "Specialities fetched successfully.",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true,
                  },

                  message: {
                    type: "string",
                    example: "Specialities fetched successfully.",
                  },

                  data: {
                    type: "array",

                    items: {
                      $ref: "#/components/schemas/Speciality",
                    },
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Unauthorized.",
        },

        403: {
          description: "Forbidden.",
        },

        500: {
          description: "Internal server error.",
        },
      },
    },
  },

  //==============================
  // Get / Update / Delete By ID
  //==============================
  "/specialities/{id}": {
    //==============================
    // Get By ID
    //==============================
    get: {
      tags: ["Speciality"],

      summary: "Get Speciality By ID",

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
        },
      ],

      responses: {
        200: {
          description: "Speciality fetched successfully.",
        },

        400: {
          description: "Invalid speciality ID.",
        },

        404: {
          description: "Speciality not found.",
        },
      },
    },

    //==============================
    // Update
    //==============================
    put: {
      tags: ["Speciality"],

      summary: "Update Speciality",

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
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateSpecialityRequest",
            },

            example: updateSpecialityExample,
          },
        },
      },

      responses: {
        200: {
          description: "Speciality updated successfully.",
        },

        400: {
          description: "Validation error.",
        },

        404: {
          description: "Speciality not found.",
        },

        409: {
          description: "Speciality already exists.",
        },
      },
    },

    //==============================
    // Delete
    //==============================
    delete: {
      tags: ["Speciality"],

      summary: "Delete Speciality",

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
        },
      ],

      responses: {
        200: {
          description: "Speciality deleted successfully.",
        },

        400: {
          description: "Invalid speciality ID.",
        },

        404: {
          description: "Speciality not found.",
        },
      },
    },
  },
  //==================================================
  // Get Specialities With User Count (Admin Only)
  //==================================================

  "/specialities/admin": {
    get: {
      tags: ["Speciality"],

      summary: "Get Specialities With User Count",

      description:
        "Admin-only API. Fetch specialities with pagination, search, filters, sorting and registered user counts.",

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
            example: 1,
            minimum: 1,
          },
          description: "Page number.",
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            example: 20,
            minimum: 1,
            maximum: 100,
          },
          description: "Number of records per page.",
        },
        {
          in: "query",
          name: "search",
          schema: {
            type: "string",
            example: "Cardiology",
          },
          description: "Search by speciality name.",
        },
        {
          in: "query",
          name: "sortBy",
          schema: {
            type: "string",
            enum: ["specialityName", "createdAt", "updatedAt"],
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
          name: "specialityName",
          schema: {
            type: "string",
            example: "Cardiology",
          },
          description:
            "Filter by speciality name, according to your filters utility's query format.",
        },
      ],

      responses: {
        200: {
          description:
            "Specialities with registered user counts fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SpecialitiesAdminResponse",
              },
            },
          },
        },

        401: {
          description: "Unauthorized. Access token is missing or invalid.",
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
};

export default specialityPaths;
