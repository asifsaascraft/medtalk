const idParameter = {
  in: "path",
  name: "id",
  required: true,
  schema: {
    type: "string",
    example: "672a12345678901234567890",
  },
  description: "Conference MongoDB ObjectId.",
};

const paginationParameters = [
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
    description: "Number of conferences per page.",
  },
  {
    in: "query",
    name: "search",
    schema: {
      type: "string",
      example: "Annual Medical",
    },
    description: "Search by conference name or venue.",
  },
  {
    in: "query",
    name: "specialityId",
    schema: {
      type: "string",
      example: "672a12345678901234567890",
    },
    description: "Filter by speciality ID.",
  },
  {
    in: "query",
    name: "conferenceType",
    schema: {
      type: "string",
      enum: ["Paid", "Free", "Restricted"],
    },
    description: "Filter by conference type.",
  },
  {
    in: "query",
    name: "status",
    schema: {
      type: "string",
      enum: ["Active", "Inactive"],
    },
    description: "Filter by conference status.",
  },
  {
    in: "query",
    name: "sortBy",
    schema: {
      type: "string",
      enum: [
        "conferenceName",
        "startDateTime",
        "endDateTime",
        "conferenceType",
        "amount",
        "status",
        "createdAt",
        "updatedAt",
      ],
      example: "startDateTime",
    },
    description: "Field used for sorting.",
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
];

const jsonResponse = (description, schema = "ConferenceSuccessResponse") => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schema}`,
      },
    },
  },
});

const multipartRequestBody = {
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        $ref: "#/components/schemas/ConferenceRequest",
      },
      encoding: {
        image: {
          contentType: "image/jpeg, image/png, image/webp",
        },
        banner: {
          contentType: "image/jpeg, image/png, image/webp",
        },
        brochureUpload: {
          contentType: "application/pdf",
        },
      },
    },
  },
};

const conferencePaths = {
  //==================================================
  // ADMIN: CREATE AND GET CONFERENCES
  //==================================================

  "/conferences": {
    post: {
      tags: ["Conference"],
      summary: "Create Conference",
      description:
        "Create a conference. Admin only. Provide conference details including conferenceDetail. Upload image, banner and PDF brochure using multipart/form-data.",
      security: [{ bearerAuth: [] }],
      requestBody: multipartRequestBody,
      responses: {
        201: jsonResponse("Conference created successfully."),
        400: jsonResponse(
          "Invalid fields, conference type or uploaded files.",
          "AuthErrorResponse",
        ),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
        409: jsonResponse(
          "Conference name already exists.",
          "AuthErrorResponse",
        ),
        500: jsonResponse("Internal server error.", "AuthErrorResponse"),
      },
    },

    get: {
      tags: ["Conference"],
      summary: "Get Conferences (Paginated)",
      description:
        "Admin-only conference list with pagination, search, filtering, sorting and Redis caching.",
      security: [{ bearerAuth: [] }],
      parameters: paginationParameters,
      responses: {
        200: jsonResponse(
          "Conferences fetched successfully.",
          "ConferencesPaginatedResponse",
        ),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
        500: jsonResponse("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  //==================================================
  // ADMIN: GET ALL WITHOUT PAGINATION
  //==================================================

  "/conferences/all": {
    get: {
      tags: ["Conference"],
      summary: "Get All Conferences Without Pagination",
      description: "Fetch all conferences without pagination. Admin only.",
      security: [{ bearerAuth: [] }],
      parameters: paginationParameters.filter(
        (parameter) => !["page", "limit"].includes(parameter.name),
      ),
      responses: {
        200: jsonResponse(
          "Conferences fetched successfully.",
          "ConferencesListResponse",
        ),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
      },
    },
  },

  //==================================================
  // ADMIN: GET / UPDATE / DELETE BY ID
  //==================================================

  "/conferences/{id}": {
    get: {
      tags: ["Conference"],
      summary: "Get Conference By ID",
      security: [{ bearerAuth: [] }],
      parameters: [idParameter],
      responses: {
        200: jsonResponse("Conference fetched successfully."),
        400: jsonResponse("Invalid conference ID.", "AuthErrorResponse"),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
        404: jsonResponse("Conference not found.", "AuthErrorResponse"),
      },
    },

    put: {
      tags: ["Conference"],
      summary: "Update Conference",
      description:
        "Update conference details including conferenceDetail. All fields are optional. Upload only the files you want to replace. Old S3 files are deleted after a successful database update.",
      security: [{ bearerAuth: [] }],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              $ref: "#/components/schemas/ConferenceUpdateRequest",
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Conference updated successfully."),
        400: jsonResponse(
          "Invalid conference ID or fields.",
          "AuthErrorResponse",
        ),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
        404: jsonResponse("Conference not found.", "AuthErrorResponse"),
        409: jsonResponse(
          "Conference name already exists.",
          "AuthErrorResponse",
        ),
      },
    },

    delete: {
      tags: ["Conference"],
      summary: "Delete Conference",
      description:
        "Delete a conference and its associated image, banner and brochure from S3.",
      security: [{ bearerAuth: [] }],
      parameters: [idParameter],
      responses: {
        200: jsonResponse("Conference deleted successfully."),
        400: jsonResponse("Invalid conference ID.", "AuthErrorResponse"),
        401: jsonResponse("Authentication required.", "AuthErrorResponse"),
        403: jsonResponse("Admin access required.", "AuthErrorResponse"),
        404: jsonResponse("Conference not found.", "AuthErrorResponse"),
      },
    },
  },

  //==================================================
  // PUBLIC: ACTIVE CONFERENCES
  //==================================================

  "/conferences/public": {
    get: {
      tags: ["Conference"],
      summary: "Get Active Conferences (Paginated)",
      description:
        "Public API. Fetch only Active conferences with pagination, search, filtering and sorting.",
      security: [],
      parameters: paginationParameters.filter(
        (parameter) => parameter.name !== "status",
      ),
      responses: {
        200: jsonResponse(
          "Active conferences fetched successfully.",
          "ConferencesPaginatedResponse",
        ),
        500: jsonResponse("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  "/conferences/public/all": {
    get: {
      tags: ["Conference"],
      summary: "Get All Active Conferences",
      description:
        "Public API. Fetch all Active conferences without pagination.",
      security: [],
      parameters: paginationParameters.filter(
        (parameter) => !["page", "limit", "status"].includes(parameter.name),
      ),
      responses: {
        200: jsonResponse(
          "Active conferences fetched successfully.",
          "ConferencesListResponse",
        ),
      },
    },
  },

  //==================================================
  // PUBLIC: ACTIVE CONFERENCES BY TYPE
  //==================================================

  "/conferences/public/type/{conferenceType}": {
    get: {
      tags: ["Conference"],
      summary: "Get Active Conferences By Type (Paginated)",
      description:
        "Public API. Fetch Active conferences by Paid, Free or Restricted type with pagination.",
      security: [],
      parameters: [
        {
          in: "path",
          name: "conferenceType",
          required: true,
          schema: {
            type: "string",
            enum: ["Paid", "Free", "Restricted"],
          },
        },
        ...paginationParameters.filter(
          (parameter) => !["conferenceType", "status"].includes(parameter.name),
        ),
      ],
      responses: {
        200: jsonResponse(
          "Conferences fetched successfully.",
          "ConferencesPaginatedResponse",
        ),
        400: jsonResponse("Invalid conference type.", "AuthErrorResponse"),
      },
    },
  },

  "/conferences/public/type/{conferenceType}/all": {
    get: {
      tags: ["Conference"],
      summary: "Get Active Conferences By Type Without Pagination",
      description:
        "Public API. Fetch all Active conferences of the selected type without pagination.",
      security: [],
      parameters: [
        {
          in: "path",
          name: "conferenceType",
          required: true,
          schema: {
            type: "string",
            enum: ["Paid", "Free", "Restricted"],
          },
        },
        ...paginationParameters.filter(
          (parameter) =>
            !["page", "limit", "conferenceType", "status"].includes(
              parameter.name,
            ),
        ),
      ],
      responses: {
        200: jsonResponse(
          "Conferences fetched successfully.",
          "ConferencesListResponse",
        ),
        400: jsonResponse("Invalid conference type.", "AuthErrorResponse"),
      },
    },
  },
  "/conferences/public/{id}": {
  get: {
    tags: ["Conference"],

    summary:
      "Get Active Conference Details",

    description:
      "Public API. Fetch a single active conference with complete details including speciality, conference images, brochure URLs and dynamic status.",

    security: [],

    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: {
          type: "string",
          example:
            "672a12345678901234567890",
        },
        description:
          "Conference MongoDB ObjectId.",
      },
    ],

    responses: {
      200: {
        description:
          "Conference details fetched successfully.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ConferenceSuccessResponse",
            },
          },
        },
      },

      400: jsonResponse(
        "Invalid conference ID.",
        "AuthErrorResponse",
      ),

      404: jsonResponse(
        "Conference not found.",
        "AuthErrorResponse",
      ),

      500: jsonResponse(
        "Internal server error.",
        "AuthErrorResponse",
      ),
    },
  },
},
};

export default conferencePaths;
