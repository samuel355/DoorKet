import { useAuth } from "@/store/authStore";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Card, Button, TextInput, Chip } from "react-native-paper";

interface RegistrationDebugHelperProps {
  visible?: boolean;
  onTestCompleted?: (success: boolean) => void;
}

const RegistrationDebugHelper: React.FC<RegistrationDebugHelperProps> = ({
  visible = true,
  onTestCompleted,
}) => {
  const { signUpWithEmail, createUserProfile, isLoading, error } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [testStep, setTestStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Test data
  const [testData, setTestData] = useState({
    email: "testuser@gmail.com",
    password: "testpass123",
    full_name: "Test User",
    university: "KNUST",
    user_type: "student" as const,
  });

  // Only show in development
  if (!__DEV__ || !visible) {
    return null;
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
    console.log("🧪 REGISTRATION DEBUG:", logEntry);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestStep(0);
  };

  const testStep1SignUp = async () => {
    try {
      setTestStep(1);
      addLog("🚀 Step 1: Testing signUpWithEmail...");

      const result = await signUpWithEmail(testData.email, testData.password);

      if (result.success) {
        addLog("✅ Step 1 SUCCESS: User account created");
        setTestStep(2);
        return true;
      } else {
        addLog(`❌ Step 1 FAILED: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      addLog(`💥 Step 1 ERROR: ${error.message}`);
      return false;
    }
  };

  const testStep2Profile = async () => {
    try {
      setTestStep(3);
      addLog("👤 Step 2: Testing createUserProfile...");

      const profileData = {
        full_name: testData.full_name,
        email: testData.email,
        user_type: testData.user_type,
        university: testData.university,
        hall_hostel: testData.user_type === "student" ? "Test Hall" : undefined,
        room_number: testData.user_type === "student" ? "101" : undefined,
      };

      const result = await createUserProfile(profileData);

      if (result.success) {
        addLog("✅ Step 2 SUCCESS: User profile created");
        setTestStep(4);
        return true;
      } else {
        addLog(`❌ Step 2 FAILED: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      addLog(`💥 Step 2 ERROR: ${error.message}`);
      return false;
    }
  };

  const runFullTest = async () => {
    clearLogs();
    addLog("🎬 Starting full registration test...");

    const step1Success = await testStep1SignUp();
    if (!step1Success) {
      addLog("🛑 Test stopped after Step 1 failure");
      onTestCompleted?.(false);
      return;
    }

    // Small delay to ensure auth state is updated
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const step2Success = await testStep2Profile();
    if (!step2Success) {
      addLog("🛑 Test stopped after Step 2 failure");
      onTestCompleted?.(false);
      return;
    }

    addLog("🎉 Full registration test completed successfully!");
    onTestCompleted?.(true);
  };

  const runStepByStep = async () => {
    if (testStep === 0) {
      await testStep1SignUp();
    } else if (testStep === 2) {
      await testStep2Profile();
    } else {
      addLog("⚠️ Test already completed or in progress");
    }
  };

  const showQuickFix = () => {
    const quickFixes = `
Common Registration Issues & Fixes:

1. "User authentication failed"
   → Check Supabase configuration
   → Verify signUpWithEmail updates auth state
   → Check console for auth errors

2. "Email already registered"
   → Use a different test email
   → Or check if user exists in Supabase

3. "Profile creation failed"
   → Check database schema
   → Verify user ID is available
   → Check createUserProfile function

4. General troubleshooting:
   → Clear app cache: npm start --clear
   → Check network connection
   → Verify environment variables
   → Check Supabase dashboard for errors
    `;

    Alert.alert("Registration Debug Guide", quickFixes, [{ text: "OK" }]);
  };

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <Text style={styles.title}>🧪 Registration Debug Helper</Text>
        <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <Chip
              icon={testStep >= 4 ? "check" : testStep > 0 ? "clock" : "play"}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    testStep >= 4
                      ? "#E8F5E8"
                      : testStep > 0
                        ? "#FFF3E0"
                        : "#F0F0F0",
                },
              ]}
            >
              Status:{" "}
              {testStep >= 4
                ? "COMPLETED"
                : testStep > 0
                  ? "IN PROGRESS"
                  : "READY"}
            </Chip>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
            </View>
          )}

          <Text style={styles.infoText}>Test Email: {testData.email}</Text>
          <Text style={styles.infoText}>
            Test Password: {testData.password}
          </Text>
          <Text style={styles.warningText}>
            ⚠️ Use valid email domains (gmail.com, outlook.com, etc.)
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Test Email"
              value={testData.email}
              onChangeText={(email) =>
                setTestData((prev) => ({ ...prev, email }))
              }
              mode="outlined"
              style={styles.input}
              dense
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={runFullTest}
              loading={isLoading}
              disabled={isLoading}
              style={styles.testButton}
              buttonColor="#4CAF50"
            >
              Run Full Test
            </Button>

            <Button
              mode="outlined"
              onPress={runStepByStep}
              disabled={isLoading || testStep >= 4}
              style={styles.stepButton}
            >
              {testStep === 0
                ? "Test Step 1"
                : testStep === 2
                  ? "Test Step 2"
                  : "Steps Complete"}
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button mode="text" onPress={clearLogs} style={styles.clearButton}>
              Clear Logs
            </Button>

            <Button
              mode="text"
              onPress={showQuickFix}
              style={styles.helpButton}
            >
              Quick Fix Guide
            </Button>
          </View>

          {logs.length > 0 && (
            <View style={styles.logContainer}>
              <Text style={styles.logTitle}>Debug Logs:</Text>
              <ScrollView style={styles.logScroll} nestedScrollEnabled>
                {logs.map((log, index) => (
                  <Text key={index} style={styles.logText}>
                    {log}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.instructions}>
            💡 This tests the complete registration flow: signUpWithEmail →
            createUserProfile
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  expandIcon: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusRow: {
    marginBottom: 8,
  },
  chip: {
    alignSelf: "flex-start",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  warningText: {
    fontSize: 12,
    color: "#ff9800",
    marginBottom: 8,
    fontStyle: "italic",
  },
  inputContainer: {
    marginVertical: 8,
  },
  input: {
    backgroundColor: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  testButton: {
    flex: 1,
    borderRadius: 8,
  },
  stepButton: {
    flex: 1,
    borderRadius: 8,
    borderColor: "#2196F3",
  },
  clearButton: {
    flex: 1,
  },
  helpButton: {
    flex: 1,
  },
  logContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    maxHeight: 200,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  logScroll: {
    maxHeight: 150,
  },
  logText: {
    fontSize: 12,
    color: "#444",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  instructions: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
});

export default RegistrationDebugHelper;
