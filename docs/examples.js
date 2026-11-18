
//==================================================
// Speciality Examples
//==================================================

export const createSpecialityExample = {
  specialityName: "Cardiology",
};

export const updateSpecialityExample = {
  specialityName: "Neurology",
};

//==================================================
// Authentication Examples
//==================================================

// Admin Setup
export const setupAdminExample = {
  fullName: "Asif Jamal",
  email: "admin@example.com",
  mobile: "9876543210",
  affiliation: "MedTalk",
  specialityId: "672a12345678901234567890",
  password: "StrongPassword@123",
};

// Admin Login
export const adminLoginExample = {
  email: "admin@example.com",
  password: "StrongPassword@123",
};

// Admin Forgot Password
export const adminForgotPasswordExample = {
  email: "admin@example.com",
};

// Admin Reset Password
export const adminResetPasswordExample = {
  password: "NewStrongPassword@123",
  confirmPassword: "NewStrongPassword@123",
};

// Admin Change Password
export const adminChangePasswordExample = {
  currentPassword: "OldStrongPassword@123",
  newPassword: "NewStrongPassword@123",
  confirmPassword: "NewStrongPassword@123",
};

// User Registration
export const registerUserExample = {
  fullName: "Test User",
  email: "testuser@example.com",
  mobile: "9876543210",
  affiliation: "Apollo Hospital",
  specialityId: "672a12345678901234567890",
};

// Send Mobile OTP
export const sendMobileOtpExample = {
  mobile: "9876543210",
};

// Verify Mobile OTP
export const verifyMobileOtpExample = {
  mobile: "9876543210",
  otp: "123456",
};

// Send Email OTP
export const sendEmailOtpExample = {
  email: "testuser@example.com",
};

// Verify Email OTP
export const verifyEmailOtpExample = {
  email: "testuser@example.com",
  otp: "123456",
};


 //==================================================
 // Faculty Examples
 //==================================================

// Create Faculty
export const createFacultyExample = {
  fullName: "Dr. Rahul Sharma",
  email: "rahul.sharma@example.com",
  mobile: "9876543210",
  affiliation: "Apollo Hospital",
  specialityId: "672a12345678901234567890",
};

// Update Faculty
export const updateFacultyExample = {
  fullName: "Dr. Rahul Sharma",
  email: "rahul.sharma@example.com",
  mobile: "9876543210",
  affiliation: "Yashoda Hospital",
  specialityId: "672a12345678901234567890",
};


 //==================================================
 // User Management Examples
 //==================================================

// Update User Profile
export const updateUserProfileExample = {
  fullName: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  mobile: "9876543210",
  affiliation: "Yashoda Hospital",
  specialityId: "672a12345678901234567890",
  profileImage: null,
};
