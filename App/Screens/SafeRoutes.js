import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';

const ORS_API_KEY = '5b3ce3597851110001cf6248a6980ac287b3424cbca263266db428bd';

const SimpleMap = () => {
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to get coordinates from OpenStreetMap (Nominatim)
  const getCoordinates = async (place) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
      );

      if (response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
        };
      } else {
        Alert.alert('Error', 'Could not find location. Try another address.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      Alert.alert('Error', 'Could not fetch coordinates.');
      return null;
    }
  };

  // Function to get route from OpenRouteService
  const getRoute = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Enter valid locations.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
        { coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] },
        { headers: { Authorization: `Bearer ${ORS_API_KEY}` } }
      );

      if (response.data.features.length > 0) {
        const routeCoords = response.data.features[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        setRoute(routeCoords);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Could not calculate route.');
    }

    setLoading(false);
  };

  // Handle Search Button Click
  const handleSearch = async () => {
    const startCoordinates = await getCoordinates(fromText);
    const endCoordinates = await getCoordinates(toText);

    if (startCoordinates && endCoordinates) {
      setFrom(startCoordinates);
      setTo(endCoordinates);
      getRoute();
    }
  };

  return (
    <View style={styles.container}>
      {/* Input Fields */}
      <TextInput style={styles.input} placeholder="From" value={fromText} onChangeText={setFromText} />
      <TextInput style={styles.input} placeholder="To" value={toText} onChangeText={setToText} />
      <Button title="Show Route" onPress={handleSearch} color="blue" />

      {/* Map Display */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <MapView
          style={styles.map}
          region={
            from
              ? {
                  latitude: from.latitude,
                  longitude: from.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
              : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 }
          }
        >
          {from && <Marker coordinate={from} title="From" pinColor="green" />}
          {to && <Marker coordinate={to} title="To" pinColor="blue" />}
          {route.length > 0 && <Polyline coordinates={route} strokeWidth={4} strokeColor="red" />}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  map: {
    flex: 1,
    marginTop: 10,
  },
});

export default SimpleMap;
