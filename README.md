# 🌤️ SkyCast Weather App 

Ek modern, responsive aur feature-rich Weather Application jo **Open-Meteo API** (Free, No API key required) ka upayog karti hai.

Is project me **dono options** uplabdh hain:
1. **🌐 Web App (HTML, Modern Glassmorphism CSS, JavaScript)** — Kisi bhi browser me turant chala sakte hain.
2. **🖥️ Python Desktop GUI App (`tkinter`)** — Bina kisi external package install kiye standard Python se desktop window me chalegi.

---

## ✨ Features

- 🔍 **Live Search Autocomplete**: Sheher ka naam type karte hi instant suggestions dikhte hain.
- 📍 **GPS / My Location**: Ek click me aapka current location detect karke wahan ka mausam batata hai.
- 🌡️ **Comprehensive Weather Stats**:
  - Current Temperature, Feels Like, High/Low
  - 💧 Humidity (Percentage & comfort rating)
  - 💨 Wind Speed & Direction (Compass arrow indicator)
  - ☀️ UV Index (With safety advice: Low, Moderate, High, Extreme)
  - 🍃 Air Quality Index (US AQI rating & health advice)
  - 🌧️ Precipitation / Rain Probability %
  - ⏱️ Surface Atmospheric Pressure (hPa)
- ⏱️ **24-Hour Hourly Forecast**: Agle 24 ghanto ka ghanta-dar-ghanta mausam horizontal slider me.
- 📅 **7-Day Extended Forecast**: Aage ke 7 dino ka min/max visual range bar ke sath forecast.
- 🔄 **Unit Switcher**: Instant `°C` (Celsius) aur `°F` (Fahrenheit) toggle.
- 🎨 **Dynamic Atmosphere Themes**: Mausam aur din/raat ke anusar dynamic background badalta hai (Sunny, Night starry, Rain, Clouds, Storm, Snow).
- 💾 **Recent Searches**: Pichle search kiye gaye sheher `localStorage` me save rehte hain.

---

## 🚀  How to Run

### Option 1: Web App (Browser me chalayein - Recommended)

#### Method A: Direct Open
Apne computer ke file explorer me `weather-app` folder khole aur **`index.html`** file par double-click kare. Yeh aapke default browser (Chrome, Edge, Firefox) me turant open ho jayegi.

#### Method B: Local Server (Optional)
Terminal / Command Prompt me ye command chalayein:
```bash
cd weather-app
python -m http.server 8000
```
Fir browser me `http://localhost:8000` kholein.

---

### Option 2: Python Desktop GUI App

Agar aap Python GUI window me mausam dekhna chahte hain:
```bash
python weather-app/weather_gui.py
```
*(Isme koi `pip install` ki zaroorat nahi hai, yeh standard library se chalti hai).*

---

## 📁 Files Structure
```
weather-app/
├── index.html        # Modern HTML5 App Structure
├── style.css         # Glassmorphism, animations & responsive styling
├── app.js            # Open-Meteo integration, autocomplete & rendering logic
├── weather_gui.py    # Standalone Desktop Tkinter GUI App
└── README.md         # Documentation & guide
```

---

## 📡 APIs Used
- **Weather Data**: [Open-Meteo Forecast API](https://open-meteo.com/) (Free, open-source, no API key required)
- **Air Quality**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- **Geocoding**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- **Reverse Geolocation**: [BigDataCloud Client Geocode](https://api.bigdatacloud.net/)
