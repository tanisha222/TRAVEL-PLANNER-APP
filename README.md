## 🧳 Travel Explorer App

Your AI-Powered Travel Companion. This full-stack web application helps users discover weather, top-rated hotels, restaurants, and attractions around the world using their current location. The app integrates with real-time APIs to fetch travel recommendations, streamlining the process of planning your trip and making it more personalized and efficient.Built with React, Node.js, Express, and TailwindCSS, this app integrates OpenWeatherMap for live weather and Google Gemini API for place recommendations.

---

### 🌄 Preview

*(Screenshot of the Site)*
<img width="1329" height="902" alt="image" src="https://github.com/user-attachments/assets/03038e73-af1a-4beb-bc3f-45166c20fbce" />
<img width="1330" height="862" alt="image" src="https://github.com/user-attachments/assets/bbc1e97a-fa76-41ab-9e7a-dc16dc9b2b0d" />
<img width="1315" height="846" alt="image" src="https://github.com/user-attachments/assets/7e7f420b-6630-4275-bfbe-ab8dd8330728" />

---

### ✨ Features

* 🌤 Real-time weather details for any city
* 📍 Top 5 tourist attractions powered by Gemini AI
* 🏨 Smart hotel suggestions with price and ratings
* 🍽 Curated restaurant listings with cuisine types
* 🔍 Input box with instant search + Enter key support
* 📱 Responsive UI with TailwindCSS and elegant cards

---
OpenWeatherMap API
* Gemini 1.5 Flash (Google Generative Language API)
### 🛠️ Technologies Used

| Frontend     | Backend           | API Integration                                  |
| ------------ | ----------------- | -----------------------------------------------  |
| React (Vite) | Node.js + Express | OpenWeatherMap API                               |
| Tailwind CSS | dotenv, cors      | Gemini 1.5 Flash (Google Generative Language API)|
| Axios        |                   |                                                  |

---

### 📁 Folder Structure

```
Travel-App/
├── client/                 # React frontend
│   ├── App.jsx
│   ├── App.css
│   └── ...
├── server/                 # Express backend
│   ├── index.js
│   ├── .env
│   └── ...
```

---

### ⚙️ How It Works

1. User enters city → weather API gives coordinates
2. Gemini API uses coordinates to suggest:

   * 5 places
   * 5 hotels (with price + rating)
   * 5 restaurants (with cuisine type)
3. Data is rendered beautifully on cards

---

### 🔮 Future Improvements

* 🔐 User authentication and favorites
* 🗺️ Interactive map with markers
* 📌 Save planned itineraries
* 💬 Multilingual support

---

### 👩‍💻 Author

* 💼 https://github.com/tanisha222
* 🔗 https://www.linkedin.com/in/tanisha-chauhan-9227671b0/



