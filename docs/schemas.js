export const schemas = {
  //==================================================
  // Speciality
  //==================================================

  Speciality: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      specialityName: {
        type: "string",
        example: "Cardiology",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  //==================================================
  // Speciality Request Schemas
  //==================================================

  CreateSpecialityRequest: {
    type: "object",
    required: ["specialityName"],
    properties: {
      specialityName: {
        type: "string",
        example: "Cardiology",
      },
    },
  },

  UpdateSpecialityRequest: {
    type: "object",
    required: ["specialityName"],
    properties: {
      specialityName: {
        type: "string",
        example: "Neurology",
      },
    },
  },

  //==================================================
  // Authentication Request Schemas
  //==================================================

  SetupAdminRequest: {
    type: "object",
    required: [
      "fullName",
      "email",
      "mobile",
      "affiliation",
      "specialityId",
      "password",
    ],
    properties: {
      fullName: {
        type: "string",
        example: "Asif Jamal",
      },
      email: {
        type: "string",
        format: "email",
        example: "admin@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      affiliation: {
        type: "string",
        example: "MedTalk",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        maxLength: 128,
        example: "StrongPassword@123",
      },
    },
  },

  AdminLoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "admin@example.com",
      },
      password: {
        type: "string",
        format: "password",
        example: "StrongPassword@123",
      },
    },
  },

  AdminForgotPasswordRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "admin@example.com",
      },
    },
  },

  AdminResetPasswordRequest: {
    type: "object",
    required: ["password", "confirmPassword"],
    properties: {
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        maxLength: 128,
        example: "NewStrongPassword@123",
      },
      confirmPassword: {
        type: "string",
        format: "password",
        example: "NewStrongPassword@123",
      },
    },
  },

  AdminChangePasswordRequest: {
    type: "object",
    required: ["currentPassword", "newPassword", "confirmPassword"],
    properties: {
      currentPassword: {
        type: "string",
        format: "password",
        example: "OldStrongPassword@123",
      },
      newPassword: {
        type: "string",
        format: "password",
        minLength: 8,
        maxLength: 128,
        example: "NewStrongPassword@123",
      },
      confirmPassword: {
        type: "string",
        format: "password",
        example: "NewStrongPassword@123",
      },
    },
  },

  RegisterUserRequest: {
    type: "object",
    required: ["fullName", "email", "mobile", "affiliation", "specialityId"],
    properties: {
      fullName: {
        type: "string",
        example: "Test User",
      },
      email: {
        type: "string",
        format: "email",
        example: "testuser@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      affiliation: {
        type: "string",
        example: "Apollo Hospital",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
    },
  },

  SendMobileOtpRequest: {
    type: "object",
    required: ["mobile"],
    properties: {
      mobile: {
        type: "string",
        example: "9876543210",
      },
    },
  },

  VerifyMobileOtpRequest: {
    type: "object",
    required: ["mobile", "otp"],
    properties: {
      mobile: {
        type: "string",
        example: "9876543210",
      },
      otp: {
        type: "string",
        minLength: 6,
        maxLength: 6,
        example: "123456",
      },
    },
  },

  SendEmailOtpRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "testuser@example.com",
      },
    },
  },

  VerifyEmailOtpRequest: {
    type: "object",
    required: ["email", "otp"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "testuser@example.com",
      },
      otp: {
        type: "string",
        minLength: 6,
        maxLength: 6,
        example: "123456",
      },
    },
  },

  //==================================================
  // Authentication Response Schemas
  //==================================================

  AuthUser: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      fullName: {
        type: "string",
        example: "Asif Jamal",
      },
      email: {
        type: "string",
        format: "email",
        example: "admin@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      affiliation: {
        type: "string",
        example: "MedTalk",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
      profileImage: {
        type: "string",
        nullable: true,
        example: null,
      },
      role: {
        type: "string",
        enum: ["user", "admin"],
        example: "user",
      },
      status: {
        type: "string",
        enum: ["pending", "active"],
        example: "active",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  AuthSession: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      sessionId: {
        type: "string",
        example: "session_abc123",
      },
      user: {
        type: "string",
        example: "672a12345678901234567890",
      },
      deviceName: {
        type: "string",
        nullable: true,
        example: "Chrome on Windows",
      },
      browser: {
        type: "string",
        nullable: true,
        example: "Chrome",
      },
      operatingSystem: {
        type: "string",
        nullable: true,
        example: "Windows",
      },
      ipAddress: {
        type: "string",
        nullable: true,
        example: "127.0.0.1",
      },
      isActive: {
        type: "boolean",
        example: true,
      },
      lastActivityAt: {
        type: "string",
        format: "date-time",
      },
      expiresAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  AuthSuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Operation completed successfully.",
      },
      data: {
        type: "object",
        nullable: true,
      },
    },
  },

  AuthErrorResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
      },
      message: {
        type: "string",
        example: "Validation error.",
      },
    },
  },
};

export default schemas;
