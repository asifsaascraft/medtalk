
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

      description: "Get all specialities with search and sorting.",

      security: [
        {
          bearerAuth: [],
        },
      ],

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
};

export default specialityPaths;
