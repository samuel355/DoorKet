import React from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, Card, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

// Basic placeholder component for User Management
const UserManagementScreen: React.FC<{
  navigation?: any;
}> = ({ navigation }) => {
  const theme = useTheme();
  console.log(theme);

  return (
    <SafeAreaView style={styles.container} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View
            style={[styles.iconContainer, { backgroundColor: "#FF980015" }]}
          >
            <Ionicons name="people" size={48} color="#FF9800" />
          </View>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Manage students and runners</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.message}>
              This screen is currently under development and will be available
              in a future update.
            </Text>

            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Planned Features:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>
                  View all registered users
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>User profile management</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>
                  Account verification status
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>User activity monitoring</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {navigation && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            icon="arrow-left"
          >
            Go Back
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginBottom: 24,
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  backButton: {
    borderRadius: 12,
    alignSelf: "center",
    minWidth: 120,
  },
});

export default UserManagementScreen;
