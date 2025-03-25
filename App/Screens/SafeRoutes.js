import React, { useState , useEffect} from 'react';
import { Linking } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import { 
  View, TextInput, Text, Button, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

const ORS_API_KEY = '5b3ce3597851110001cf6248a6980ac287b3424cbca263266db428bd';  // Replace with your API Key

const SafeRoutes = () => {
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [route, setRoute] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Bounding Box for Tamil Nadu (minLon, minLat, maxLon, maxLat)
  const TAMIL_NADU_BBOX = [76.0, 8.0, 80.5, 13.5];

  useEffect(() => {
    startLocationTracking();
  }, []);
  // Fetch place suggestions from OpenRouteService within Tamil Nadu
  const fetchPlaceSuggestions = async (query, setSuggestions) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`https://api.openrouteservice.org/geocode/search`, {
        params: {
          api_key: ORS_API_KEY,
          text: query,
          size: 5,
          bbox: TAMIL_NADU_BBOX.join(','), // Restrict search within Tamil Nadu
        },
      });

      const tamilNaduPlaces = response.data.features.filter(
        (place) => place.properties.region === 'Tamil Nadu' // Ensure it's in Tamil Nadu
      );

      setSuggestions(tamilNaduPlaces);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Could not fetch place suggestions.');
    }
  };
  //location -- background
  const LOCATION_TRACKING_TASK = "background-location-task";

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Location tracking task error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations.length > 0) {
      const userLocation = locations[0].coords;
      console.log("Updated Location:", userLocation);

      // Update state with new location (This part runs in background)
      updateUserLocation(userLocation);
    }
  }
});
const startLocationTracking = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert("Permission Denied", "Location access is required for tracking.");
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    Alert.alert("Permission Denied", "Background location access is required.");
    return;
  }

  const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
  if (!isTaskRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 10, // Minimum distance change to trigger an update (in meters)
      deferredUpdatesInterval: 30000,
      foregroundService: {
        notificationTitle: "Tracking your location",
        notificationBody: "Location is being updated in the background",
      },
    });
    console.log("Background location tracking started");
  }
};
const updateUserLocation = async (newLocation) => {
  setFrom({ latitude: newLocation.latitude, longitude: newLocation.longitude });

  if (to) {
    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
        { coordinates: [[newLocation.longitude, newLocation.latitude], [to.longitude, to.latitude]] },
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
      console.error('Error updating route:', error);
    }
  }
};


  
  //open in google map 
  const openInGoogleMaps = () => {
    if (!from || !to) {
      Alert.alert('Error', 'Enter valid locations.');
      return;
    }
  
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=walking`;
  
    Linking.openURL(googleMapsUrl);
  };
  
  // Handle selection of a suggested location
  const selectSuggestion = (item, setText, setCoordinates, setSuggestions) => {
    setText(item.properties.label);
    setCoordinates({
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    });
    setSuggestions([]);
  };

  // Fetch user's current location
  const getCurrentLocationForFrom = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Allow location access to use this feature.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setFrom({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    setFromText('My Current Location');
    setFromSuggestions([]);
  };

  // Get Safe Route
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
  
  return (
    <View style={styles.container}>
      
      {/* From Input Box */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>From:</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Enter starting location"
            value={fromText}
            onChangeText={(text) => {
              setFromText(text);
              fetchPlaceSuggestions(text, setFromSuggestions);
            }}
          />
          <TouchableOpacity style={styles.iconButton} onPress={getCurrentLocationForFrom}>
            <Text style={styles.icon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {fromSuggestions.length > 0 && (
        <FlatList
          data={fromSuggestions}
          keyExtractor={(item) => item.properties.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item, setFromText, setFrom, setFromSuggestions)}
            >
              <Text style={styles.suggestionText}>{item.properties.label}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* To Input Box */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>To:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter destination"
          value={toText}
          onChangeText={(text) => {
            setToText(text);
            fetchPlaceSuggestions(text, setToSuggestions);
          }}
        />
      </View>

      {toSuggestions.length > 0 && (
        <FlatList
          data={toSuggestions}
          keyExtractor={(item) => item.properties.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item, setToText, setTo, setToSuggestions)}
            >
              <Text style={styles.suggestionText}>{item.properties.label}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Show Route Button */}
      <View style={styles.buttonContainer}>
        <Button title="Show Route" onPress={getRoute} color="blue" />
      </View>

      {/* Map Display */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <MapView 
          style={styles.map} 
          region={from ? { latitude: from.latitude, longitude: from.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 } : { latitude: 11.1271, longitude: 78.6569, latitudeDelta: 2, longitudeDelta: 2 }} // Tamil Nadu centered
        >
          {from && <Marker coordinate={from} title="From" pinColor="green" />}
          {to && <Marker coordinate={to} title="To" pinColor="blue" />}
          {route.length > 0 && <Polyline coordinates={route} strokeWidth={4} strokeColor="red" />}
        </MapView>
        
      )}
      <TouchableOpacity style={styles.navigateButton} onPress={openInGoogleMaps}>
  <Text style={styles.navigateButtonText}>🗺️</Text>
</TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },

  inputBox: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  
  suggestionItem: {
    backgroundColor: '#E8E8E8',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    marginVertical: 2,
  },

  suggestionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  buttonContainer: {
    marginVertical: 10,
  },

  map: {
    flex: 1,
    marginTop: 10,
  },
  navigateButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
  
  navigateButtonText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  
});

export default SafeRoutes;
