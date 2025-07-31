import { createStackNavigator } from '@react-navigation/stack'
import React, { Component } from 'react'
import { Text, View } from 'react-native'

const stack = createStackNavigator()

export class AppNavigator extends Component {
  render() {
    return (
      <View>
        <Text> textInComponent </Text>
      </View>
    )
  }
}

export default AppNavigator
