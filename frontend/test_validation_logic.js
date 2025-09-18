// Test script to verify admissions form validation logic
// This simulates the validation function behavior

const testFormData = {
  applicant_name: "",
  date_of_birth: "",
  course_applied: "",
  phone_number: "",
  email: "",
  address: "",
  category: "",
  father_name: "",
  father_phone: "",
  father_occupation: "",
  mother_name: "",
  mother_phone: "",
  mother_occupation: "",
  acceptedTerms: false
};

const isEmailVerified = false;

// Validation function for step 6
function getValidationStatus(step = 6, formData = testFormData, isEmailVerified = false) {
  if (step !== 6) return { isValid: true, missingFields: [] };
  
  const missingFields = [];
  
  // Check basic info
  if (formData.applicant_name.trim().length <= 1) missingFields.push("Full Name");
  if (!formData.date_of_birth) missingFields.push("Date of Birth");
  if (!formData.course_applied) missingFields.push("Class/Course Applying For");
  if (!formData.phone_number) missingFields.push("Contact Number");
  if (!formData.email) missingFields.push("Email Address");
  if (!formData.address) missingFields.push("Address");
  if (!formData.category) missingFields.push("Category");
  if (!isEmailVerified) missingFields.push("Email Verification");
  
  // Check parent info
  if (formData.father_name.trim().length <= 1) missingFields.push("Father's Name");
  if (!formData.father_phone) missingFields.push("Father's Phone");
  if (!formData.father_occupation) missingFields.push("Father's Occupation");
  if (formData.mother_name.trim().length <= 1) missingFields.push("Mother's Name");
  if (!formData.mother_phone) missingFields.push("Mother's Phone");
  if (!formData.mother_occupation) missingFields.push("Mother's Occupation");
  
  // Check terms acceptance
  if (!formData.acceptedTerms) missingFields.push("Accept Terms and Conditions");
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

console.log("=== Testing Validation Logic ===\n");

// Test 1: Empty form
console.log("Test 1: Empty form");
const result1 = getValidationStatus(6, testFormData, false);
console.log("Is Valid:", result1.isValid);
console.log("Missing Fields:", result1.missingFields);
console.log();

// Test 2: Partially filled form
console.log("Test 2: Partially filled form");
const partialFormData = {
  ...testFormData,
  applicant_name: "John Doe",
  email: "john@example.com",
  acceptedTerms: true
};
const result2 = getValidationStatus(6, partialFormData, true);
console.log("Is Valid:", result2.isValid);
console.log("Missing Fields:", result2.missingFields);
console.log();

// Test 3: Complete form
console.log("Test 3: Complete form");
const completeFormData = {
  applicant_name: "John Doe",
  date_of_birth: "2000-01-01",
  course_applied: "Engineering",
  phone_number: "1234567890",
  email: "john@example.com",
  address: "123 Main St",
  category: "General",
  father_name: "John Sr.",
  father_phone: "0987654321",
  father_occupation: "Engineer",
  mother_name: "Jane Doe",
  mother_phone: "5555555555",
  mother_occupation: "Doctor",
  acceptedTerms: true
};
const result3 = getValidationStatus(6, completeFormData, true);
console.log("Is Valid:", result3.isValid);
console.log("Missing Fields:", result3.missingFields);
console.log();

// Test 4: Email not verified
console.log("Test 4: Complete form but email not verified");
const result4 = getValidationStatus(6, completeFormData, false);
console.log("Is Valid:", result4.isValid);
console.log("Missing Fields:", result4.missingFields);
console.log();

console.log("=== Test Complete ===");