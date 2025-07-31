import { RootStackParamList } from '@/types'
import { createStackNavigator } from '@react-navigation/stack'
import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'

const stack = createStackNavigator<RootStackParamList>()

//Loading on Screen
const LoadingScreen:React.FC = () => {
  return(
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>Loading ChopCart...</Text>
    </View>
  )
}

export class AppNavigator extends Component {
  render() {
    return (
      <View>
        <Text> textInComponent </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default AppNavigator
