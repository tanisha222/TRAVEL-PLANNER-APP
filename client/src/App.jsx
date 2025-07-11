import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    if (!city) {
      setErrorMessage('Please enter a city name.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setWeather(null);
    setPlaces([]);
    setHotels([]);
    setRestaurants([]);

    try {
      const weatherRes = await axios.get(`http://localhost:5000/weather?city=${city}`);
      setWeather(weatherRes.data);

      const placesRes = await axios.get(`http://localhost:5000/places?city=${city}`);
      const { places, location_id, latitude, longitude } = placesRes.data;
      setPlaces(places);

      if (!latitude || !longitude) {
        setErrorMessage(`Could not find geographic coordinates for the city.`);
        setLoading(false);
        return;
      }

      try {
        const hotelsRes = await axios.get(`http://localhost:5000/hotels?location_id=${location_id}&latitude=${latitude}&longitude=${longitude}`);
        setHotels(hotelsRes.data || []);
      } catch {
        setHotels([]);
      }

      try {
        const restaurantsRes = await axios.get(`http://localhost:5000/restaurants?location_id=${location_id}&latitude=${latitude}&longitude=${longitude}`);
        setRestaurants(restaurantsRes.data || []);
      } catch {
        setRestaurants([]);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(`Error: ${error.response.data.error || 'Something went wrong on the server.'}`);
      } else {
        setErrorMessage('Error: Failed to connect to server or network issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') fetchData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-800">✈️ Travel Planner</h1>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter a city name (e.g., Mumbai, Delhi, London)"
            className="flex-grow px-5 py-3 rounded-xl border border-gray-300 shadow focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 shadow">
            {errorMessage}
          </div>
        )}

        {weather && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-lg mb-6 border border-blue-200">
            <h2 className="text-2xl font-bold mb-3 text-blue-700 border-b border-blue-300 pb-1">🌤 Weather in {weather.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div><p className="text-sm text-gray-600">Temperature</p><p className="font-bold text-lg">{weather.main.temp}°C</p></div>
              <div><p className="text-sm text-gray-600">Condition</p><p className="font-medium capitalize">{weather.weather[0].description}</p></div>
              <div><p className="text-sm text-gray-600">Humidity</p><p className="font-medium">{weather.main.humidity}%</p></div>
              <div><p className="text-sm text-gray-600">Wind Speed</p><p className="font-medium">{weather.wind.speed} m/s</p></div>
            </div>
          </div>
        )}

        {places.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">📍 Top Places in {city}</h2>
            <div className="grid gap-4">
              {places.map((place, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-white shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
                  <h3 className="text-lg font-bold text-blue-800">{place.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{place.secondaryInfo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hotels.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">🏨 Hotels</h2>
            <div className="grid gap-4">
              {hotels.map((hotel, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-white shadow-md flex gap-4 hover:shadow-lg transition-transform transform hover:scale-105">
                  {hotel.image && (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-green-800">{hotel.name}</h3>
                    <p className="text-sm text-gray-600">{hotel.address}</p>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⭐ {hotel.rating}</span>
                      {hotel.price !== 'N/A' && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{hotel.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {restaurants.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-700">🍽 Restaurants</h2>
            <div className="grid gap-4">
              {restaurants.map((rest, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-white shadow-md flex gap-4 hover:shadow-lg transition-transform transform hover:scale-105">
                  {rest.image && (
                    <img
                      src={rest.image}
                      alt={rest.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-red-800">{rest.name}</h3>
                    <p className="text-sm text-gray-600">{rest.address}</p>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⭐ {rest.rating}</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{rest.cuisine}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {weather && places.length === 0 && hotels.length === 0 && restaurants.length === 0 && !loading && !errorMessage && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md shadow-md">
            <p>Only weather data was found. Places, hotels, and restaurants might not be available for this location.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
