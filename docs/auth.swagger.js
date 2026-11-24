import {
  setupAdminExample,
  adminLoginExample,
  adminForgotPasswordExample,
  adminResetPasswordExample,
  adminChangePasswordExample,
  registerUserExample,
  sendMobileOtpExample,
  verifyMobileOtpExample,
  sendEmailOtpExample,
  verifyEmailOtpExample,
} from "./examples.js";

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

const response = (description, schema = "AuthSuccessResponse") => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schema}`,
      },
    },
  },
});

const authPaths = {
  //==================================================
  // ADMIN AUTHENTICATION
  //==================================================

  // Admin Setup
  "/auth/admin/setup": {
    post: {
      tags: ["Admin"],
      summary: "Create Admin Account",
      description:
        "One-time admin account creation. Requires the configured setup secret in the request header. Only one admin account is allowed.",

      security: [],

      parameters: [
        {
          in: "header",
          name: "x-admin-setup-secret",
          required: true,
          schema: {
            type: "string",
          },
          description:
            "Admin setup secret configured in the backend environment.",
        },
      ],

      requestBody: jsonRequest("SetupAdminRequest", setupAdminExample),

      responses: {
        201: response("Admin account created successfully."),
        400: response(
          "Missing or invalid registration fields.",
          "AuthErrorResponse",
        ),
        403: response(
          "Invalid admin setup authorization.",
          "AuthErrorResponse",
        ),
        404: response("Speciality not found.", "AuthErrorResponse"),
        409: response(
          "Admin account or contact details already exist.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Admin Login
  "/auth/admin/login": {
    post: {
      tags: ["Admin"],
      summary: "Admin Login",
      description:
        "Authenticate the admin using email and password. Returns an access token and sets an HTTP-only refresh-token cookie.",

      security: [],

      requestBody: jsonRequest("AdminLoginRequest", adminLoginExample),

      responses: {
        200: {
          description:
            "Admin login successful. Refresh token is set in an HTTP-only cookie.",
          headers: {
            "Set-Cookie": {
              description: "HTTP-only refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        400: response(
          "Email and password are required or invalid.",
          "AuthErrorResponse",
        ),
        401: response("Invalid email or password.", "AuthErrorResponse"),
        409: response(
          "A login is already being processed.",
          "AuthErrorResponse",
        ),
        423: response(
          "Admin account is temporarily locked.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Admin Forgot Password
  "/auth/admin/forgot-password": {
    post: {
      tags: ["Admin"],
      summary: "Admin Forgot Password",
      description:
        "Request a password-reset link sent to the registered admin email address.",

      security: [],

      requestBody: jsonRequest(
        "AdminForgotPasswordRequest",
        adminForgotPasswordExample,
      ),

      responses: {
        200: response(
          "If an admin account exists, password reset instructions will be sent.",
        ),
        400: response("Invalid or missing email address.", "AuthErrorResponse"),
        500: response(
          "Password-reset email could not be sent.",
          "AuthErrorResponse",
        ),
      },
    },
  },

  // Admin Reset Password
  "/auth/admin/reset-password/{token}": {
    post: {
      tags: ["Admin"],
      summary: "Admin Reset Password",
      description:
        "Reset the admin password using the one-time token received by email. The token expires after the configured duration.",

      security: [],

      parameters: [
        {
          in: "path",
          name: "token",
          required: true,
          schema: {
            type: "string",
          },
          description: "Password-reset token received in the email.",
        },
      ],

      requestBody: jsonRequest(
        "AdminResetPasswordRequest",
        adminResetPasswordExample,
      ),

      responses: {
        200: response("Admin password reset successfully."),
        400: response(
          "Invalid, expired, or missing token, or invalid password.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Admin Change Password
  "/auth/admin/change-password": {
    post: {
      tags: ["Admin"],
      summary: "Admin Change Password",
      description:
        "Change the authenticated admin's password. All active sessions are revoked after a successful password change.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: jsonRequest(
        "AdminChangePasswordRequest",
        adminChangePasswordExample,
      ),

      responses: {
        200: response("Password changed successfully. Please login again."),
        400: response(
          "Missing fields, invalid password, or password mismatch.",
          "AuthErrorResponse",
        ),
        401: response(
          "Current password is incorrect or authentication failed.",
          "AuthErrorResponse",
        ),
        403: response(
          "Only admins can change their password.",
          "AuthErrorResponse",
        ),
        404: response("Admin account not found.", "AuthErrorResponse"),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  //==================================================
  // USER AUTHENTICATION
  //==================================================

  // User Registration
  "/auth/user/register": {
    post: {
      tags: ["Users"],
      summary: "Register User",
      description:
        "Register a new user account. Public registration always creates an account with the user role.",

      security: [],

      requestBody: jsonRequest("RegisterUserRequest", registerUserExample),

      responses: {
        201: response("User registered successfully."),
        400: response(
          "Invalid or missing registration fields.",
          "AuthErrorResponse",
        ),
        404: response("Speciality not found.", "AuthErrorResponse"),
        409: response(
          "Email or mobile number is already registered.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Send Mobile OTP
  "/auth/user/login/mobile/send-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Send Mobile OTP",
      description:
        "Send a six-digit login OTP to the registered user's mobile number. OTP expires after the configured duration. Resend cooldown and rate limits apply.",

      security: [],

      requestBody: jsonRequest("SendMobileOtpRequest", sendMobileOtpExample),

      responses: {
        200: response(
          "OTP request processed. If an active account exists, an OTP will be sent.",
        ),
        400: response("Invalid or missing mobile number.", "AuthErrorResponse"),
        429: response(
          "OTP request cooldown or OTP lock limit reached.",
          "AuthErrorResponse",
        ),
        500: response(
          "SMS provider or internal server error.",
          "AuthErrorResponse",
        ),
      },
    },
  },

  // Verify Mobile OTP
  "/auth/user/login/mobile/verify-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Verify Mobile OTP",
      description:
        "Verify the OTP sent to the registered mobile number. On success, creates a login session, returns an access token, and sets an HTTP-only refresh-token cookie.",

      security: [],

      requestBody: jsonRequest(
        "VerifyMobileOtpRequest",
        verifyMobileOtpExample,
      ),

      responses: {
        200: {
          description: "OTP verified and user logged in successfully.",
          headers: {
            "Set-Cookie": {
              description: "HTTP-only refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        400: response("Invalid, expired, or missing OTP.", "AuthErrorResponse"),
        401: response("Invalid OTP or account.", "AuthErrorResponse"),
        409: response(
          "A login is already being processed.",
          "AuthErrorResponse",
        ),
        429: response(
          "Maximum OTP attempts reached or account temporarily locked.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Send Email OTP
  "/auth/user/login/email/send-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Send Email OTP",
      description:
        "Send a six-digit login OTP to the registered user's email address. OTP expires after the configured duration. Resend cooldown and rate limits apply.",

      security: [],

      requestBody: jsonRequest("SendEmailOtpRequest", sendEmailOtpExample),

      responses: {
        200: response(
          "OTP request processed. If an active account exists, an OTP will be sent.",
        ),
        400: response("Invalid or missing email address.", "AuthErrorResponse"),
        429: response(
          "OTP request cooldown or OTP lock limit reached.",
          "AuthErrorResponse",
        ),
        500: response(
          "Email provider or internal server error.",
          "AuthErrorResponse",
        ),
      },
    },
  },

  // Verify Email OTP
  "/auth/user/login/email/verify-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Verify Email OTP",
      description:
        "Verify the OTP sent to the registered email address. On success, creates a login session, returns an access token, and sets an HTTP-only refresh-token cookie.",

      security: [],

      requestBody: jsonRequest("VerifyEmailOtpRequest", verifyEmailOtpExample),

      responses: {
        200: {
          description: "OTP verified and user logged in successfully.",
          headers: {
            "Set-Cookie": {
              description: "HTTP-only refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        400: response("Invalid, expired, or missing OTP.", "AuthErrorResponse"),
        401: response("Invalid OTP or account.", "AuthErrorResponse"),
        409: response(
          "A login is already being processed.",
          "AuthErrorResponse",
        ),
        429: response(
          "Maximum OTP attempts reached or account temporarily locked.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  //==================================================
  // SHARED SESSION APIs
  //==================================================

  // Refresh Access Token
  "/auth/refresh-token": {
    post: {
      tags: ["Authentication"],
      summary: "Refresh Access Token",
      description:
        "Generate a new access token using the HTTP-only refreshToken cookie. Rotates the refresh token while preserving the existing session ID.",

      security: [
        {
          refreshCookie: [],
        },
      ],

      responses: {
        200: {
          description: "Access token refreshed successfully.",
          headers: {
            "Set-Cookie": {
              description: "Updated HTTP-only refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        401: response(
          "Missing, invalid, expired, or revoked refresh token.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Logout
  "/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Logout Current Session",
      description:
        "Revoke the currently authenticated session and clear the HTTP-only refresh-token cookie.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Logged out successfully.",
          headers: {
            "Set-Cookie": {
              description: "Clears the refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        401: response(
          "Unauthorized or session already revoked.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Logout All Devices
  "/auth/logout-all": {
    post: {
      tags: ["Authentication"],
      summary: "Logout All Devices",
      description:
        "Revoke all active sessions belonging to the authenticated user and clear the current refresh-token cookie.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Logged out from all devices successfully.",
          headers: {
            "Set-Cookie": {
              description: "Clears the refreshToken cookie.",
              schema: {
                type: "string",
              },
            },
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        401: response(
          "Unauthorized or session already revoked.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },

  // Get Current User
  "/auth/me": {
    get: {
      tags: ["Authentication"],
      summary: "Get Current User",
      description:
        "Fetch the currently authenticated user's profile and active session details.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "User profile fetched successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSuccessResponse",
              },
            },
          },
        },
        401: response(
          "Unauthorized, expired token, or revoked session.",
          "AuthErrorResponse",
        ),
        500: response("Internal server error.", "AuthErrorResponse"),
      },
    },
  },
  "/auth/profile-image": {
    put: {
      tags: ["Authentication"],
      summary: "Upload Profile Image",

      description:
        "Upload or replace the current authenticated user's profile image.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["profileImage"],
              properties: {
                profileImage: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Profile image updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProfileImageResponse",
              },
            },
          },
        },

        400: response("Invalid file.", "AuthErrorResponse"),

        401: response("Unauthorized.", "AuthErrorResponse"),

        404: response("User not found.", "AuthErrorResponse"),
      },
    },

    delete: {
      tags: ["Authentication"],

      summary: "Delete Profile Image",

      description: "Deletes authenticated user's profile image.",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: response("Profile image deleted successfully."),

        401: response("Unauthorized.", "AuthErrorResponse"),

        404: response("User not found.", "AuthErrorResponse"),
      },
    },
  },
};

export default authPaths;
