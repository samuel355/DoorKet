import { useAuth } from "@/store/authStore";
import { StatusBar } from "expo-status-bar";
import React from "react";

import AdminNavigator from "./AdminNavigator";
import AuthNavigator from "./AuthNavigator";
import RunnerNavigator from "./RunnerNavigator";
import StudentNavigator from "./StudentNavigator";

const AppNavigator: React.FC = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  // Show auth loading or auth flow
  if (isLoading || !isAuthenticated || !profile) {
    return (
      <>
        <StatusBar style="auto" />
        <AuthNavigator />
      </>
    );
  }

  // Show appropriate navigator based on user type
  const getCurrentNavigator = () => {
    switch (profile.user_type) {
      case "student":
        return <StudentNavigator />;
      case "runner":
        return <RunnerNavigator />;
      case "admin":
        return <AdminNavigator />;
      default:
        return <AuthNavigator />;
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      {getCurrentNavigator()}
    </>
  );
};

export default AppNavigator;
