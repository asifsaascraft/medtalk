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
      usersCount: {
        type: "integer",
        example: 25,
        description: "Number of users registered under this speciality.",
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

  SpecialitiesAdminResponse: {
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
          allOf: [
            {
              $ref: "#/components/schemas/Speciality",
            },
          ],
        },
      },
      meta: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          total: {
            type: "integer",
            example: 50,
          },
          totalPages: {
            type: "integer",
            example: 3,
          },
          hasPreviousPage: {
            type: "boolean",
            example: false,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
        },
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

  //==================================================
  // Faculty
  //==================================================

  Faculty: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      fullName: {
        type: "string",
        example: "Dr. Rahul Sharma",
      },
      email: {
        type: "string",
        format: "email",
        example: "rahul.sharma@example.com",
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
        },
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
  // Faculty Request Schemas
  //==================================================

  CreateFacultyRequest: {
    type: "object",
    required: ["fullName", "email", "mobile", "affiliation", "specialityId"],
    properties: {
      fullName: {
        type: "string",
        example: "Dr. Rahul Sharma",
        minLength: 2,
        maxLength: 100,
      },
      email: {
        type: "string",
        format: "email",
        example: "rahul.sharma@example.com",
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

  UpdateFacultyRequest: {
    type: "object",
    required: ["fullName", "email", "mobile", "affiliation", "specialityId"],
    properties: {
      fullName: {
        type: "string",
        example: "Dr. Rahul Sharma",
      },
      email: {
        type: "string",
        format: "email",
        example: "rahul.sharma@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      affiliation: {
        type: "string",
        example: "Yashoda Hospital",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
    },
  },

  //==================================================
  // Faculty Responses
  //==================================================

  FacultySuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Faculty fetched successfully.",
      },
      data: {
        $ref: "#/components/schemas/Faculty",
      },
    },
  },

  FacultiesListResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Faculties fetched successfully.",
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Faculty",
        },
      },
      pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          total: {
            type: "integer",
            example: 50,
          },
          totalPages: {
            type: "integer",
            example: 3,
          },
          from: {
            type: "integer",
            example: 1,
          },
          to: {
            type: "integer",
            example: 20,
          },
          hasPreviousPage: {
            type: "boolean",
            example: false,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
        },
      },
    },
  },

  //==================================================
  // User Management
  //==================================================

  UserManagementUser: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      fullName: {
        type: "string",
        example: "Rahul Sharma",
      },
      email: {
        type: "string",
        format: "email",
        example: "rahul.sharma@example.com",
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
        },
      },
      profileImage: {
        type: "string",
        nullable: true,
        example: null,
      },
      role: {
        type: "string",
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

  UpdateUserProfileRequest: {
    type: "object",
    properties: {
      fullName: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        example: "Rahul Sharma",
      },
      email: {
        type: "string",
        format: "email",
        example: "rahul.sharma@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      affiliation: {
        type: "string",
        minLength: 2,
        maxLength: 300,
        example: "Yashoda Hospital",
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
    },
    description:
      "All fields are optional. Only profile fields can be updated. Role, password and authentication fields cannot be changed through this API.",
  },

  UsersListResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Users fetched successfully.",
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/UserManagementUser",
        },
      },
    },
  },

  UsersPaginatedResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Users fetched successfully.",
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/UserManagementUser",
        },
      },
      pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          total: {
            type: "integer",
            example: 100,
          },
          totalPages: {
            type: "integer",
            example: 5,
          },
          from: {
            type: "integer",
            example: 1,
          },
          to: {
            type: "integer",
            example: 20,
          },
          hasPreviousPage: {
            type: "boolean",
            example: false,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
        },
      },
    },
  },

  UserProfileSuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "User profile updated successfully.",
      },
      data: {
        $ref: "#/components/schemas/UserManagementUser",
      },
    },
  },

  Conference: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "672a12345678901234567890",
      },
      conferenceName: {
        type: "string",
        example: "Annual Medical Conference 2026",
      },
      specialityId: {
        oneOf: [
          { type: "string" },
          { $ref: "#/components/schemas/Speciality" },
        ],
      },
      startDateTime: {
        type: "string",
        format: "date-time",
        example: "2026-12-10T09:00:00.000Z",
      },
      endDateTime: {
        type: "string",
        format: "date-time",
        example: "2026-12-12T18:00:00.000Z",
      },
      venue: {
        type: "string",
        example: "Hyderabad International Convention Centre",
      },
      conferenceType: {
        type: "string",
        enum: ["Paid", "Free", "Restricted"],
        example: "Paid",
      },
      amount: {
        type: "number",
        nullable: true,
        example: 1500,
      },
      image: {
        type: "string",
        format: "uri",
        example:
          "https://bucket.s3.ap-south-1.amazonaws.com/conferences/images/image.jpg",
      },
      banner: {
        type: "string",
        format: "uri",
        example:
          "https://bucket.s3.ap-south-1.amazonaws.com/conferences/images/banner.jpg",
      },
      brochureUpload: {
        type: "string",
        format: "uri",
        example:
          "https://bucket.s3.ap-south-1.amazonaws.com/conferences/brochures/brochure.pdf",
      },
      status: {
        type: "string",
        enum: ["Active", "Inactive"],
        example: "Active",
      },
      dynamicStatus: {
        type: "string",
        nullable: true,
        enum: ["Upcoming", "Live", "Past"],
        example: "Upcoming",
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

  ConferenceRequest: {
    type: "object",
    required: [
      "conferenceName",
      "specialityId",
      "startDateTime",
      "endDateTime",
      "venue",
      "conferenceType",
      "image",
      "banner",
      "brochureUpload",
    ],
    properties: {
      conferenceName: {
        type: "string",
        example: "Annual Medical Conference 2026",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
      startDateTime: {
        type: "string",
        format: "date-time",
        example: "2026-12-10T09:00:00.000Z",
      },
      endDateTime: {
        type: "string",
        format: "date-time",
        example: "2026-12-12T18:00:00.000Z",
      },
      venue: {
        type: "string",
        example: "Hyderabad International Convention Centre",
      },
      conferenceType: {
        type: "string",
        enum: ["Paid", "Free", "Restricted"],
        example: "Paid",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 1500,
        description: "Required only when conferenceType is Paid.",
      },
      image: {
        type: "string",
        format: "binary",
        description: "Conference image. JPG, JPEG, PNG or WEBP. Maximum 5MB.",
      },
      banner: {
        type: "string",
        format: "binary",
        description: "Conference banner. JPG, JPEG, PNG or WEBP. Maximum 5MB.",
      },
      brochureUpload: {
        type: "string",
        format: "binary",
        description: "Conference brochure PDF. Maximum 10MB.",
      },
      status: {
        type: "string",
        enum: ["Active", "Inactive"],
        default: "Active",
      },
    },
  },

  ConferenceSuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Conference fetched successfully.",
      },
      data: {
        $ref: "#/components/schemas/Conference",
      },
    },
  },

  ConferencesListResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Conferences fetched successfully.",
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Conference",
        },
      },
    },
  },

  ConferencesPaginatedResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Conferences fetched successfully.",
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Conference",
        },
      },
      pagination: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            example: 45,
          },
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          totalPages: {
            type: "integer",
            example: 3,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
          hasPrevPage: {
            type: "boolean",
            example: false,
          },
        },
      },
    },
  },

  ConferenceUpdateRequest: {
    type: "object",
    properties: {
      conferenceName: {
        type: "string",
        example: "Annual Medical Conference 2026",
      },
      specialityId: {
        type: "string",
        example: "672a12345678901234567890",
      },
      startDateTime: {
        type: "string",
        format: "date-time",
      },
      endDateTime: {
        type: "string",
        format: "date-time",
      },
      venue: {
        type: "string",
        example: "Hyderabad International Convention Centre",
      },
      conferenceType: {
        type: "string",
        enum: ["Paid", "Free", "Restricted"],
      },
      amount: {
        type: "number",
        minimum: 0,
      },
      image: {
        type: "string",
        format: "binary",
        description: "Optional replacement image. Maximum 5MB.",
      },
      banner: {
        type: "string",
        format: "binary",
        description: "Optional replacement banner. Maximum 5MB.",
      },
      brochureUpload: {
        type: "string",
        format: "binary",
        description: "Optional replacement PDF brochure. Maximum 10MB.",
      },
      status: {
        type: "string",
        enum: ["Active", "Inactive"],
      },
    },
  },
};

export default schemas;
