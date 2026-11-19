
const conferenceIdParameter = {
  name: "conferenceId",
  in: "path",
  required: true,
  description: "MongoDB ID of the parent Conference.",
  schema: {
    type: "string",
    example: "672a12345678901234567890",
  },
};

const hallIdParameter = {
  name: "hallId",
  in: "path",
  required: true,
  description: "MongoDB ID of the Hall.",
  schema: {
    type: "string",
    example: "672b12345678901234567890",
  },
};

const hallListParameters = [
  {
    name: "page",
    in: "query",
    schema: {
      type: "integer",
      minimum: 1,
      default: 1,
    },
    description: "Page number.",
  },
  {
    name: "limit",
    in: "query",
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 20,
    },
    description: "Number of halls per page.",
  },
  {
    name: "search",
    in: "query",
    schema: {
      type: "string",
    },
    description: "Search by hall name.",
    example: "Main Auditorium",
  },
  {
    name: "status",
    in: "query",
    schema: {
      type: "string",
      enum: ["Active", "Inactive"],
    },
    description: "Filter halls by status. Not applicable to active-only endpoints.",
  },
  {
    name: "sortBy",
    in: "query",
    schema: {
      type: "string",
      enum: [
        "hallName",
        "status",
        "createdAt",
        "updatedAt",
      ],
      default: "createdAt",
    },
    description: "Field used for sorting.",
  },
  {
    name: "order",
    in: "query",
    schema: {
      type: "string",
      enum: ["asc", "desc"],
      default: "desc",
    },
    description: "Sorting order.",
  },
];

const hallPaths = {
  //==================================================
  // CREATE HALL AND GET ALL HALLS
  //==================================================

  "/conferences/{conferenceId}/halls": {
    post: {
      tags: ["Admin - Halls"],
      summary: "Create Hall",
      description:
        "Creates a Hall inside the Conference specified by conferenceId in the URL. Do not send conferenceId in the request body.",
      security: [{ bearerAuth: [] }],
      parameters: [conferenceIdParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateHallRequest",
            },
            example: {
              hallName: "Main Auditorium",
              streamLink: "https://example.com/live-stream",
              status: "Active",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Hall created successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/HallResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid conference ID or validation error.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference not found.",
        },
        409: {
          description: "Hall name already exists in this Conference.",
        },
        500: {
          description: "Internal server error.",
        },
      },
    },

    get: {
      tags: ["Admin - Halls"],
      summary: "Get All Halls With Pagination",
      description:
        "Returns all halls belonging to the specified Conference with pagination, searching, filtering and sorting.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        ...hallListParameters,
      ],
      responses: {
        200: {
          description: "Halls fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedHallsResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid conference ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference not found.",
        },
        500: {
          description: "Internal server error.",
        },
      },
    },
  },

  //==================================================
  // GET ACTIVE HALLS WITH PAGINATION
  //==================================================

  "/conferences/{conferenceId}/halls/active": {
    get: {
      tags: ["Admin - Halls"],
      summary: "Get Active Halls With Pagination",
      description:
        "Returns only Active halls belonging to the specified Conference.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        ...hallListParameters.filter(
          (parameter) => parameter.name !== "status",
        ),
      ],
      responses: {
        200: {
          description: "Active halls fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedHallsResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid conference ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference not found.",
        },
      },
    },
  },

  //==================================================
  // GET ACTIVE HALLS WITHOUT PAGINATION
  //==================================================

  "/conferences/{conferenceId}/halls/active/all": {
    get: {
      tags: ["Admin - Halls"],
      summary: "Get All Active Halls Without Pagination",
      description:
        "Returns all Active halls belonging to the specified Conference without pagination.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        ...hallListParameters.filter(
          (parameter) =>
            !["page", "limit", "status"].includes(parameter.name),
        ),
      ],
      responses: {
        200: {
          description: "Active halls fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/HallsResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid conference ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference not found.",
        },
      },
    },
  },

  //==================================================
  // GET, UPDATE AND DELETE HALL BY ID
  //==================================================

  "/conferences/{conferenceId}/halls/{hallId}": {
    get: {
      tags: ["Admin - Halls"],
      summary: "Get Hall By ID",
      description:
        "Fetches a Hall only if it belongs to the Conference specified in the URL.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        hallIdParameter,
      ],
      responses: {
        200: {
          description: "Hall fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/HallResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid conference ID or hall ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference or Hall not found.",
        },
      },
    },

    put: {
      tags: ["Admin - Halls"],
      summary: "Update Hall",
      description:
        "Updates hallName, streamLink or status. All fields are optional. conferenceId must not be sent in the request body.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        hallIdParameter,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateHallRequest",
            },
            examples: {
              updateName: {
                summary: "Update Hall Name",
                value: {
                  hallName: "Updated Main Auditorium",
                },
              },
              updateStreamLink: {
                summary: "Update Stream Link",
                value: {
                  streamLink: "https://example.com/new-live-stream",
                },
              },
              updateStatus: {
                summary: "Update Status",
                value: {
                  status: "Inactive",
                },
              },
              updateAll: {
                summary: "Update Multiple Fields",
                value: {
                  hallName: "Updated Main Auditorium",
                  streamLink: "https://example.com/new-live-stream",
                  status: "Active",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Hall updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/HallResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid IDs or validation error.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference or Hall not found.",
        },
        409: {
          description: "Hall name already exists in this Conference.",
        },
      },
    },

    delete: {
      tags: ["Admin - Halls"],
      summary: "Delete Hall",
      description:
        "Deletes a Hall only if it belongs to the Conference specified in the URL.",
      security: [{ bearerAuth: [] }],
      parameters: [
        conferenceIdParameter,
        hallIdParameter,
      ],
      responses: {
        200: {
          description: "Hall deleted successfully.",
        },
        400: {
          description: "Invalid conference ID or hall ID.",
        },
        401: {
          description: "Unauthorized.",
        },
        403: {
          description: "Admin access required.",
        },
        404: {
          description: "Conference or Hall not found.",
        },
      },
    },
  },
};

export default hallPaths;
