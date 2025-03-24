import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome } from '@expo/vector-icons';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleEmergencyPress = () => {
    alert('Emergency Activated!');
  };

  return (
    <View style={styles.container}>
      {/* Grid Boxes */}
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridBox} onPress={() => navigation.navigate('SafeRoutes')}>
          <Text style={styles.boxText}>Safe Routes</Text>
        </TouchableOpacity>
        <View style={styles.gridBox}><Text style={styles.boxText}>Alerts</Text></View>
        <View style={styles.gridBox}><Text style={styles.boxText}>Live Tracking</Text></View>
        <View style={styles.gridBox}><Text style={styles.boxText}>Reports</Text></View>
      </View>

      {/* Emergency Button */}
      <Animatable.View animation="pulse" iterationCount="infinite" easing="ease-in-out">
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyPress}>
          <FontAwesome name="exclamation-triangle" size={50} color="#fff" />
          <Text style={styles.buttonText}>EMERGENCY</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 50,
  },
  gridBox: {
    width: 100,
    height: 100,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
  boxText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emergencyButton: {
    width: 150,
    height: 150,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default HomeScreen;
