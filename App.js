import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from "./App/Screens/Home.js"
import SafeRoutes from './App/Screens/SafeRoutes.js';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="SafeRoutes" component={SafeRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
