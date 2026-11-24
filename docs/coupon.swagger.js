const conferenceIdParameter = {
  name: "conferenceId",
  in: "path",
  required: true,

  schema: {
    type: "string",
    example: "672a12345678901234567890",
  },

  description: "MongoDB ID of the Conference.",
};

const couponIdParameter = {
  name: "couponId",

  in: "path",

  required: true,

  schema: {
    type: "string",
    example: "672c12345678901234567890",
  },

  description: "MongoDB ID of the Coupon.",
};

const couponPaths = {
  "/conferences/{conferenceId}/coupons/import": {
    post: {
      tags: ["Admin - Coupons"],

      summary: "Import Coupons",

      description:
        "Import Conference Coupons using Excel or CSV file. Users are automatically created if they do not already exist.",

      security: [{ bearerAuth: [] }],

      parameters: [conferenceIdParameter],

      requestBody: {
        required: true,

        content: {
          "multipart/form-data": {
            schema: {
              $ref: "#/components/schemas/CouponImportRequest",
            },
          },
        },
      },

      responses: {
        200: {
          description: "Coupons imported successfully.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CouponImportResponse",
              },
            },
          },
        },

        400: {
          description: "Validation error.",
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
  "/conferences/{conferenceId}/coupons": {
    get: {
      tags: ["Admin - Coupons"],

      summary: "Get All Coupons",

      description: "Returns all coupons belonging to a Conference.",

      security: [{ bearerAuth: [] }],

      parameters: [conferenceIdParameter],

      responses: {
        200: {
          description: "Coupons fetched successfully.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CouponsResponse",
              },
            },
          },
        },
      },
    },
  },
  "/conferences/{conferenceId}/coupons/{couponId}": {
    get: {
      tags: ["Admin - Coupons"],

      summary: "Get Coupon By ID",

      security: [{ bearerAuth: [] }],

      parameters: [conferenceIdParameter, couponIdParameter],

      responses: {
        200: {
          description: "Coupon fetched successfully.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CouponResponse",
              },
            },
          },
        },
      },
    },

    delete: {
      tags: ["Admin - Coupons"],

      summary: "Delete Coupon",

      security: [{ bearerAuth: [] }],

      parameters: [conferenceIdParameter, couponIdParameter],

      responses: {
        200: {
          description: "Coupon deleted successfully.",
        },

        404: {
          description: "Coupon not found.",
        },
      },
    },
  },
};

export default couponPaths;
