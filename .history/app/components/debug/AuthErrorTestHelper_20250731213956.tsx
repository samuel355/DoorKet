import { useAuth } from '@/store/authStore';
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card, TextInput } from 'react-native-paper';

interface AuthErrorTestHelperProps {
  visible?: boolean;
}

const AuthErrorTestHelper: React.FC<AuthErrorTestHelperProps> = ({
  visible = __DEV__
}) => {
  const { signInWithEmail, signUpWithEmail, isLoading, error, clearError } = useAuth();
  const [testEmail, setTestEmail] = useState('invalid@test.com');
  const [testPassword, setTestPassword] = useState('wrongpassword');

  if (!visible) return null;

  const testInvalidLogin = async () => {
    console.log('🧪 Testing invalid login - should NOT crash app');

    try {
      const result = await signInWithEmail(testEmail, testPassword);

      if (!result.success) {
        Alert.alert(
          'Test Result ✅',
          `Login failed gracefully: ${result.error}\n\nApp should NOT have crashed!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Unexpected', 'Login succeeded with invalid credentials');
      }
    } catch (error: any) {
      // This should NOT happen with our fixed implementation
      console.error('❌ CRITICAL: Login error not handled properly:', error);
      Alert.alert(
        'Test Failed ❌',
        `Error was thrown instead of handled: ${error.message}\n\nThis means the app could crash!`,
        [{ text: 'Fix Required' }]
      );
    }
  };

  const testInvalidSignup = async () => {
    console.log('🧪 Testing invalid signup - should NOT crash app');

    try {
      const result = await signUpWithEmail('invalid-email', 'weak');

      if (!result.success) {
        Alert.alert(
          'Test Result ✅',
          `Signup failed gracefully: ${result.error}\n\nApp should NOT have crashed!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Unexpected', 'Signup succeeded with invalid data');
      }
    } catch (error: any) {
      // This should NOT happen with our fixed implementation
      console.error('❌ CRITICAL: Signup error not handled properly:', error);
      Alert.alert(
        'Test Failed ❌',
        `Error was thrown instead of handled: ${error.message}\n\nThis means the app could crash!`,
        [{ text: 'Fix Required' }]
      );
    }
  };

  const testEmptyCredentials = async () => {
    console.log('🧪 Testing empty credentials - should NOT crash app');

    try {
      const result = await signInWithEmail('', '');

      if (!result.success) {
        Alert.alert(
          'Test Result ✅',
          `Empty credentials handled gracefully: ${result.error}\n\nApp should NOT have crashed!`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ CRITICAL: Empty credentials error not handled properly:', error);
      Alert.alert(
        'Test Failed ❌',
        `Error was thrown instead of handled: ${error.message}`,
        [{ text: 'Fix Required' }]
      );
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>🧪 Auth Error Test Helper</Text>
        <Text style={styles.subtitle}>
          Test that auth errors dont crash the app
        </Text>

        {error && (
          <View style={styles.errorDisplay}>
            <Text style={styles.errorTitle}>Current Auth Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              mode="outlined"
              onPress={clearError}
              style={styles.clearButton}
            >
              Clear Error
            </Button>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            label="Test Email"
            value={testEmail}
            onChangeText={setTestEmail}
            style={styles.input}
            placeholder="invalid@test.com"
          />
          <TextInput
            label="Test Password"
            value={testPassword}
            onChangeText={setTestPassword}
            style={styles.input}
            placeholder="wrongpassword"
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={testInvalidLogin}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.button, styles.testButton]}
            icon="login"
          >
            Test Invalid Login
          </Button>

          <Button
            mode="contained"
            onPress={testInvalidSignup}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.button, styles.testButton]}
            icon="account-plus"
          >
            Test Invalid Signup
          </Button>

          <Button
            mode="contained"
            onPress={testEmptyCredentials}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.button, styles.testButton]}
            icon="alert"
          >
            Test Empty Credentials
          </Button>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>✅ Expected Behavior:</Text>
          <Text style={styles.infoText}>
            • Login fails with user-friendly error message{'\n'}
            • App continues running normally{'\n'}
            • No app crashes or restarts{'\n'}
            • Error is displayed in UI, not console crash
          </Text>

          <Text style={styles.warningTitle}>❌ Bad Behavior (Should NOT happen):</Text>
          <Text style={styles.warningText}>
            • App crashes or restarts{'\n'}
            • White screen of death{'\n'}
            • Unhandled promise rejection{'\n'}
            • "Async Error" causing fatal crash
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  errorDisplay: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 8,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#ff9800',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#388e3c',
    lineHeight: 18,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#d32f2f',
    lineHeight: 18,
  },
});

export default AuthErrorTestHelper;
