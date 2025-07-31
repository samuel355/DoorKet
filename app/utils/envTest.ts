// Environment Test Utility
// This file helps test and debug environment variable configuration

export interface EnvTestResult {
  isTestModeEnabled: boolean;
  testOTP: string;
  testPhoneNumber: string;
  firebaseConfigured: boolean;
  missingVars: string[];
  recommendations: string[];
}

export const testEnvironmentConfig = (): EnvTestResult => {
  const result: EnvTestResult = {
    isTestModeEnabled: false,
    testOTP: '',
    testPhoneNumber: '',
    firebaseConfigured: false,
    missingVars: [],
    recommendations: [],
  };

  // Check test mode configuration
  const testMode = process.env.EXPO_PUBLIC_ENABLE_TEST_MODE;
  result.isTestModeEnabled = testMode === 'true';

  if (!testMode) {
    result.missingVars.push('EXPO_PUBLIC_ENABLE_TEST_MODE');
    result.recommendations.push('Add EXPO_PUBLIC_ENABLE_TEST_MODE=true to .env for development');
  }

  // Check test OTP
  const testOTP = process.env.EXPO_PUBLIC_TEST_OTP_CODE;
  result.testOTP = testOTP || '123456';

  if (!testOTP) {
    result.missingVars.push('EXPO_PUBLIC_TEST_OTP_CODE');
    result.recommendations.push('Add EXPO_PUBLIC_TEST_OTP_CODE=123456 to .env');
  }

  // Check test phone number
  const testPhone = process.env.EXPO_PUBLIC_TEST_PHONE_NUMBER;
  result.testPhoneNumber = testPhone || '+233246562377';

  if (!testPhone) {
    result.missingVars.push('EXPO_PUBLIC_TEST_PHONE_NUMBER');
    result.recommendations.push('Add EXPO_PUBLIC_TEST_PHONE_NUMBER=+233246562377 to .env');
  }

  // Check Firebase configuration
  const firebaseVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingFirebaseVars = firebaseVars.filter(
    varName => !process.env[varName]
  );

  result.firebaseConfigured = missingFirebaseVars.length === 0;

  if (missingFirebaseVars.length > 0) {
    result.missingVars.push(...missingFirebaseVars);
    if (!result.isTestModeEnabled) {
      result.recommendations.push(
        'Configure Firebase environment variables or enable test mode for development'
      );
    }
  }

  // Add specific recommendations based on configuration
  if (!result.isTestModeEnabled && !result.firebaseConfigured) {
    result.recommendations.push(
      'CRITICAL: Either enable test mode OR configure Firebase for OTP to work'
    );
  }

  if (result.isTestModeEnabled) {
    result.recommendations.push(
      'Test mode is enabled - perfect for development. Remember to disable for production.'
    );
  }

  return result;
};

export const logEnvironmentStatus = (): void => {
  const result = testEnvironmentConfig();

  console.log('🔍 Environment Configuration Status:');
  console.log('====================================');
  console.log(`Test Mode: ${result.isTestModeEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Test OTP: ${result.testOTP}`);
  console.log(`Test Phone: ${result.testPhoneNumber}`);
  console.log(`Firebase: ${result.firebaseConfigured ? '✅ Configured' : '❌ Not Configured'}`);

  if (result.missingVars.length > 0) {
    console.log('\n❌ Missing Environment Variables:');
    result.missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log('====================================');
};

export const getQuickFixInstructions = (): string => {
  const result = testEnvironmentConfig();

  if (result.isTestModeEnabled) {
    return `
✅ Test mode is enabled! You can test OTP with:
   Phone: ${result.testPhoneNumber}
   OTP: ${result.testOTP}
`;
  }

  return `
❌ Quick fix needed! Add to your .env file:

EXPO_PUBLIC_ENABLE_TEST_MODE=true
EXPO_PUBLIC_TEST_OTP_CODE=123456
EXPO_PUBLIC_TEST_PHONE_NUMBER=+233246562377

Then restart your app: npm start
`;
};

// Helper to check if OTP functionality should work
export const canOTPWork = (): { canWork: boolean; reason: string } => {
  const result = testEnvironmentConfig();

  if (result.isTestModeEnabled) {
    return {
      canWork: true,
      reason: 'Test mode is enabled - OTP will work with test credentials',
    };
  }

  if (result.firebaseConfigured) {
    return {
      canWork: true,
      reason: 'Firebase is configured - OTP should work with real phone numbers',
    };
  }

  return {
    canWork: false,
    reason: 'Neither test mode nor Firebase is properly configured',
  };
};

// Export for use in components
export default {
  testEnvironmentConfig,
  logEnvironmentStatus,
  getQuickFixInstructions,
  canOTPWork,
};
