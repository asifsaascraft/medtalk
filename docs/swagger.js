import swaggerJsdoc from "swagger-jsdoc";

import paths from "./index.js";
import schemas from "./schemas.js";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "MedTalk API",
      version: "1.0.0",
      description: "Official REST API documentation for the MedTalk Backend.",
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: "Local Development",
      },
      {
        url: `${process.env.API_BASE_URL}/api`,
        description: "Production",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "User authentication and session management APIs.",
      },
      {
        name: "Users",
        description: "User registration and user-related APIs.",
      },
      {
        name: "Admin",
        description: "Admin account and authentication APIs.",
      },
      {
        name: "Speciality",
        description: "Speciality management APIs.",
      },
      {
        name: "Faculty",
        description: "Faculty management APIs. Admin access only.",
      },
      {
        name: "Conference",
        description:
          "Conference management, uploads and public conference APIs.",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        refreshCookie: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description:
            "HTTP-only refresh token cookie set automatically after successful login.",
        },
      },

      schemas,
    },

    // Protected by default.
    // Public endpoints override this using security: [].
    security: [
      {
        bearerAuth: [],
      },
    ],

    paths,
  },

  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
