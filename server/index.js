const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Simple root route for basic server check
app.get('/', (req, res) => {
  res.send('Travel Planner Backend API is running! Access frontend at http://localhost:5173 (or your Vite dev server port).');
});

// ✅ Weather Endpoint
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  const apiKey = process.env.WEATHER_API;

  if (!city || !apiKey) {
    return res.status(400).json({ error: 'Missing city or API key' });
  }

  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: apiKey, units: 'metric' },
    });
    res.json(data);
  } catch (err) {
    console.error('❌ Weather fetch error:', err.message);
    if (err.response) {
      console.error('Weather API error response data:', err.response.data);
    }
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

// ✅ Places Endpoint (using Gemini API)
app.get('/places', async (req, res) => {
  const city = req.query.city;
  const weatherApiKey = process.env.WEATHER_API;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!city) return res.status(400).json({ error: 'City is required' });

  let latitude, longitude;
  let places = [];
  let debugOutput = {
    hasGeoId: true, // Gemini doesn't need geoId, so we'll use lat/lon
    geoIdValue: 'gemini-api',
    placesCount: 0
  };

  try {
    // Get coordinates from OpenWeatherMap
    const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: weatherApiKey, units: 'metric' },
    });
    latitude = weatherRes.data.coord.lat;
    longitude = weatherRes.data.coord.lon;
    console.log(`📍 Got coordinates from OpenWeather: lat=${latitude}, lon=${longitude}`);
  } catch (err) {
    console.error('❌ Failed to get coordinates from OpenWeather:', err.message);
    return res.status(500).json({ error: 'Failed to get coordinates for the city' });
  }

  try {
    // Use Gemini API to get places recommendations
    console.log(`🔍 Getting places recommendations for ${city} using Gemini API`);

    const geminiPrompt = `Generate 5 top tourist attractions and places to visit in ${city}.
    For each place, provide:
    1. Name of the place
    2. Brief description (what makes it special)

    Format the response as a JSON array with objects containing "name" and "secondaryInfo" fields.
    Example format:
    [
      {
        "name": "Place Name",
        "secondaryInfo": "Brief description of the place"
      }
    ]

    Make sure the response is valid JSON only, no additional text.`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('--- RAW GEMINI RESPONSE FOR PLACES ---');
    console.log(JSON.stringify(geminiResponse.data, null, 2));
    console.log('------------------------------------------');

    const geminiText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (geminiText) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          places = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create a simple response
          places = [
            { name: `${city} City Center`, secondaryInfo: "Main tourist area of the city" },
            { name: `${city} Historical District`, secondaryInfo: "Explore the rich history and culture" },
            { name: `${city} Local Market`, secondaryInfo: "Experience local cuisine and shopping" },
            { name: `${city} Park/Garden`, secondaryInfo: "Relax in beautiful natural surroundings" },
            { name: `${city} Museum`, secondaryInfo: "Learn about local art and history" }
          ];
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini JSON response, using fallback places');
        places = [
          { name: `${city} City Center`, secondaryInfo: "Main tourist area of the city" },
          { name: `${city} Historical District`, secondaryInfo: "Explore the rich history and culture" },
          { name: `${city} Local Market`, secondaryInfo: "Experience local cuisine and shopping" },
          { name: `${city} Park/Garden`, secondaryInfo: "Relax in beautiful natural surroundings" },
          { name: `${city} Museum`, secondaryInfo: "Learn about local art and history" }
        ];
      }
    }

    debugOutput.placesCount = places.length;
    console.log(`📦 Final result for ${city}: places=${places.length}`);

  } catch (err) {
    console.error('❌ Gemini API Places fetch error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response Headers:', err.response.headers);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.error('Request was made but no response received');
      console.error('Request:', err.request);
    } else {
      console.error('Error setting up request:', err.message);
    }
    console.error('Full error object:', err);

    // Fallback places if Gemini fails
    places = [
      { name: `${city} City Center`, secondaryInfo: "Main tourist area of the city" },
      { name: `${city} Historical District`, secondaryInfo: "Explore the rich history and culture" },
      { name: `${city} Local Market`, secondaryInfo: "Experience local cuisine and shopping" },
      { name: `${city} Park/Garden`, secondaryInfo: "Relax in beautiful natural surroundings" },
      { name: `${city} Museum`, secondaryInfo: "Learn about local art and history" }
    ];
    debugOutput.placesCount = places.length;
  }

  res.json({
    places,
    location_id: 'gemini-api', // Use a placeholder since we don't need geoId
    latitude,
    longitude,
    debug: debugOutput
  });
});

// ✅ Hotels Endpoint (using Gemini API)
app.get('/hotels', async (req, res) => {
  const { location_id, latitude, longitude } = req.query;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  console.log(`🏨 Hotels request - location_id: ${location_id}, lat: ${latitude}, lon: ${longitude}`);

  if (!geminiApiKey) {
    console.warn('Hotels: Missing Gemini API key. Returning empty array.');
    return res.json([]);
  }

  try {
    console.log('🏨 Getting hotel recommendations using Gemini API');

    const geminiPrompt = `Generate 5 recommended hotels for tourists visiting this location (coordinates: ${latitude}, ${longitude}).
    For each hotel, provide:
    1. Hotel name
    2. Brief description of location/area
    3. Approximate price range (Budget, Mid-range, Luxury)
    4. Rating (1-5 stars)

    Format the response as a JSON array with objects containing "name", "address", "rating", and "price" fields.
    Example format:
    [
      {
        "name": "Hotel Name",
        "address": "Location description",
        "rating": "4.5",
        "price": "Mid-range"
      }
    ]

    Make sure the response is valid JSON only, no additional text.`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('--- RAW GEMINI RESPONSE FOR HOTELS ---');
    console.log(JSON.stringify(geminiResponse.data, null, 2));
    console.log('------------------------------------------');

    const geminiText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    let hotels = [];
    if (geminiText) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedHotels = JSON.parse(jsonMatch[0]);
          hotels = parsedHotels.map(h => ({
            name: h.name || 'Unnamed Hotel',
            rating: h.rating || 'N/A',
            price: h.price || 'N/A',
            image: '', // No images from Gemini
            address: h.address || 'Address not available',
          }));
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini JSON response for hotels');
      }
    }

    // Fallback hotels if Gemini fails or returns empty
    if (hotels.length === 0) {
      hotels = [
        { name: "Grand Hotel", rating: "4.5", price: "Luxury", image: "", address: "City center location" },
        { name: "Comfort Inn", rating: "4.0", price: "Mid-range", image: "", address: "Near tourist attractions" },
        { name: "Budget Lodge", rating: "3.5", price: "Budget", image: "", address: "Affordable accommodation" },
        { name: "Business Hotel", rating: "4.2", price: "Mid-range", image: "", address: "Convenient for business travelers" },
        { name: "Boutique Hotel", rating: "4.8", price: "Luxury", image: "", address: "Unique and charming atmosphere" }
      ];
    }

    console.log(`✅ Found ${hotels.length} hotels`);
    res.json(hotels);
  } catch (err) {
    console.error('❌ Hotels Gemini API error:', err.message);
    if (err.response) {
      console.error('Hotels API response error status:', err.response.status);
      console.error('Hotels API response error data:', JSON.stringify(err.response.data, null, 2));
    }
    // Return fallback hotels
    res.json([
      { name: "Grand Hotel", rating: "4.5", price: "Luxury", image: "", address: "City center location" },
      { name: "Comfort Inn", rating: "4.0", price: "Mid-range", image: "", address: "Near tourist attractions" },
      { name: "Budget Lodge", rating: "3.5", price: "Budget", image: "", address: "Affordable accommodation" },
      { name: "Business Hotel", rating: "4.2", price: "Mid-range", image: "", address: "Convenient for business travelers" },
      { name: "Boutique Hotel", rating: "4.8", price: "Luxury", image: "", address: "Unique and charming atmosphere" }
    ]);
  }
});

// ✅ Restaurants Endpoint (using Gemini API)
app.get('/restaurants', async (req, res) => {
  const { location_id, latitude, longitude } = req.query;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  console.log(`🍽 Restaurants request - location_id: ${location_id}, lat: ${latitude}, lon: ${longitude}`);

  if (!geminiApiKey) {
    console.warn('Restaurants: Missing Gemini API key. Returning empty array.');
    return res.json([]);
  }

  try {
    console.log('🍽 Getting restaurant recommendations using Gemini API');

    const geminiPrompt = `Generate 5 recommended restaurants for tourists visiting this location (coordinates: ${latitude}, ${longitude}).
    For each restaurant, provide:
    1. Restaurant name
    2. Type of cuisine
    3. Brief description of location
    4. Rating (1-5 stars)

    Format the response as a JSON array with objects containing "name", "cuisine", "rating", and "address" fields.
    Example format:
    [
      {
        "name": "Restaurant Name",
        "cuisine": "Italian",
        "rating": "4.5",
        "address": "Location description"
      }
    ]

    Make sure the response is valid JSON only, no additional text.`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('--- RAW GEMINI RESPONSE FOR RESTAURANTS ---');
    console.log(JSON.stringify(geminiResponse.data, null, 2));
    console.log('------------------------------------------');

    const geminiText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    let restaurants = [];
    if (geminiText) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedRestaurants = JSON.parse(jsonMatch[0]);
          restaurants = parsedRestaurants.map(r => ({
            name: r.name || 'Unnamed Restaurant',
            rating: r.rating || 'N/A',
            cuisine: r.cuisine || 'N/A',
            image: '', // No images from Gemini
            address: r.address || 'Address not available',
          }));
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini JSON response for restaurants');
      }
    }

    // Fallback restaurants if Gemini fails or returns empty
    if (restaurants.length === 0) {
      restaurants = [
        { name: "Local Bistro", cuisine: "International", rating: "4.5", image: "", address: "City center dining" },
        { name: "Traditional Restaurant", cuisine: "Local Cuisine", rating: "4.2", image: "", address: "Authentic local flavors" },
        { name: "Cafe Central", cuisine: "Cafe", rating: "4.0", image: "", address: "Perfect for coffee and light meals" },
        { name: "Fine Dining", cuisine: "Gourmet", rating: "4.8", image: "", address: "Upscale dining experience" },
        { name: "Street Food Corner", cuisine: "Street Food", rating: "4.3", image: "", address: "Local street food experience" }
      ];
    }

    console.log(`✅ Found ${restaurants.length} restaurants`);
    res.json(restaurants);
  } catch (err) {
    console.error('❌ Restaurants Gemini API error:', err.message);
    if (err.response) {
      console.error('Restaurants API response error status:', err.response.status);
      console.error('Restaurants API response error data:', JSON.stringify(err.response.data, null, 2));
    }
    // Return fallback restaurants
    res.json([
      { name: "Local Bistro", cuisine: "International", rating: "4.5", image: "", address: "City center dining" },
      { name: "Traditional Restaurant", cuisine: "Local Cuisine", rating: "4.2", image: "", address: "Authentic local flavors" },
      { name: "Cafe Central", cuisine: "Cafe", rating: "4.0", image: "", address: "Perfect for coffee and light meals" },
      { name: "Fine Dining", cuisine: "Gourmet", rating: "4.8", image: "", address: "Upscale dining experience" },
      { name: "Street Food Corner", cuisine: "Street Food", rating: "4.3", image: "", address: "Local street food experience" }
    ]);
  }
});

// ✅ API Key Test
app.get('/test', async (req, res) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  let geminiTestResult = 'Not tested';
  if (geminiApiKey) {
    try {
      const testResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: "Hello, this is a test message. Please respond with 'OK' if you can read this."
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      geminiTestResult = 'Working';
    } catch (err) {
      geminiTestResult = `Error: ${err.message}`;
    }
  }

  res.json({
    message: 'Server is running',
    hasWeatherAPI: !!process.env.WEATHER_API,
    hasGeminiAPI: !!process.env.GEMINI_API_KEY,
    weatherAPILength: process.env.WEATHER_API?.length || 0,
    geminiAPILength: process.env.GEMINI_API_KEY?.length || 0,
    geminiTestResult: geminiTestResult,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});