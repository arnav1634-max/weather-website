/**
 * SkyCast - Modern Weather Application
 * Client-Side JavaScript powered by Open-Meteo APIs (No API key needed)
 */

// Application State
const state = {
  unit: localStorage.getItem('skycast_unit') || 'c', // 'c' or 'f'
  activeCity: null,
  weatherData: null,
  airQualityData: null,
  recentSearches: JSON.parse(localStorage.getItem('skycast_recent') || '[]'),
  debounceTimer: null,
  selectedIndex: -1
};

// DOM Elements
const elements = {
  cityInput: document.getElementById('cityInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  searchBtn: document.getElementById('searchBtn'),
  suggestionsDropdown: document.getElementById('suggestionsDropdown'),
  geoBtn: document.getElementById('geoBtn'),
  unitButtons: document.querySelectorAll('.unit-btn'),
  recentContainer: document.getElementById('recentContainer'),
  recentList: document.getElementById('recentList'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  errorMessage: document.getElementById('errorMessage'),
  weatherContent: document.getElementById('weatherContent'),

  // Hero Card Elements
  cityName: document.getElementById('cityName'),
  cityCountry: document.getElementById('cityCountry'),
  localTime: document.getElementById('localTime'),
  localDate: document.getElementById('localDate'),
  mainWeatherIcon: document.getElementById('mainWeatherIcon'),
  weatherDesc: document.getElementById('weatherDesc'),
  currentTemp: document.getElementById('currentTemp'),
  feelsLike: document.getElementById('feelsLike'),
  tempHigh: document.getElementById('tempHigh'),
  tempLow: document.getElementById('tempLow'),
  lastUpdated: document.getElementById('lastUpdated'),
  dayNightPill: document.getElementById('dayNightPill'),

  // Metrics
  humidityVal: document.getElementById('humidityVal'),
  humidityBar: document.getElementById('humidityBar'),
  humidityStatus: document.getElementById('humidityStatus'),
  windVal: document.getElementById('windVal'),
  windCompass: document.getElementById('windCompass'),
  windDirText: document.getElementById('windDirText'),
  windStatus: document.getElementById('windStatus'),
  uvVal: document.getElementById('uvVal'),
  uvBadge: document.getElementById('uvBadge'),
  uvAdvice: document.getElementById('uvAdvice'),
  aqiVal: document.getElementById('aqiVal'),
  aqiBadge: document.getElementById('aqiBadge'),
  aqiStatus: document.getElementById('aqiStatus'),
  rainVal: document.getElementById('rainVal'),
  rainBar: document.getElementById('rainBar'),
  rainStatus: document.getElementById('rainStatus'),
  pressureVal: document.getElementById('pressureVal'),
  pressureStatus: document.getElementById('pressureStatus'),

  // Containers
  hourlyContainer: document.getElementById('hourlyContainer'),
  dailyContainer: document.getElementById('dailyContainer')
};

// WMO Weather Interpretation Codes
const weatherCodeMap = {
  0: { desc: 'Clear sky', dayIcon: '☀️', nightIcon: '🌙', theme: 'theme-day-clear' },
  1: { desc: 'Mainly clear', dayIcon: '🌤️', nightIcon: '🌤️', theme: 'theme-day-clear' },
  2: { desc: 'Partly cloudy', dayIcon: '⛅', nightIcon: '☁️', theme: 'theme-clouds' },
  3: { desc: 'Overcast', dayIcon: '☁️', nightIcon: '☁️', theme: 'theme-clouds' },
  45: { desc: 'Foggy', dayIcon: '🌫️', nightIcon: '🌫️', theme: 'theme-clouds' },
  48: { desc: 'Depositing rime fog', dayIcon: '🌫️', nightIcon: '🌫️', theme: 'theme-clouds' },
  51: { desc: 'Light drizzle', dayIcon: '🌦️', nightIcon: '🌧️', theme: 'theme-rain' },
  53: { desc: 'Moderate drizzle', dayIcon: '🌦️', nightIcon: '🌧️', theme: 'theme-rain' },
  55: { desc: 'Dense drizzle', dayIcon: '🌧️', nightIcon: '🌧️', theme: 'theme-rain' },
  56: { desc: 'Freezing drizzle', dayIcon: '🌧️❄️', nightIcon: '🌧️❄️', theme: 'theme-snow' },
  57: { desc: 'Dense freezing drizzle', dayIcon: '🌧️❄️', nightIcon: '🌧️❄️', theme: 'theme-snow' },
  61: { desc: 'Slight rain', dayIcon: '🌦️', nightIcon: '🌧️', theme: 'theme-rain' },
  63: { desc: 'Moderate rain', dayIcon: '🌧️', nightIcon: '🌧️', theme: 'theme-rain' },
  65: { desc: 'Heavy rain', dayIcon: '🌧️', nightIcon: '🌧️', theme: 'theme-rain' },
  66: { desc: 'Freezing rain', dayIcon: '🌨️', nightIcon: '🌨️', theme: 'theme-snow' },
  67: { desc: 'Heavy freezing rain', dayIcon: '🌨️', nightIcon: '🌨️', theme: 'theme-snow' },
  71: { desc: 'Slight snow fall', dayIcon: '🌨️', nightIcon: '🌨️', theme: 'theme-snow' },
  73: { desc: 'Moderate snow fall', dayIcon: '❄️', nightIcon: '❄️', theme: 'theme-snow' },
  75: { desc: 'Heavy snow fall', dayIcon: '❄️', nightIcon: '❄️', theme: 'theme-snow' },
  77: { desc: 'Snow grains', dayIcon: '❄️', nightIcon: '❄️', theme: 'theme-snow' },
  80: { desc: 'Slight rain showers', dayIcon: '🌦️', nightIcon: '🌧️', theme: 'theme-rain' },
  81: { desc: 'Moderate rain showers', dayIcon: '🌧️', nightIcon: '🌧️', theme: 'theme-rain' },
  82: { desc: 'Violent rain showers', dayIcon: '⛈️', nightIcon: '⛈️', theme: 'theme-rain' },
  85: { desc: 'Slight snow showers', dayIcon: '🌨️', nightIcon: '🌨️', theme: 'theme-snow' },
  86: { desc: 'Heavy snow showers', dayIcon: '❄️', nightIcon: '❄️', theme: 'theme-snow' },
  95: { desc: 'Thunderstorm', dayIcon: '⛈️', nightIcon: '⛈️', theme: 'theme-storm' },
  96: { desc: 'Thunderstorm with slight hail', dayIcon: '⛈️⚡', nightIcon: '⛈️⚡', theme: 'theme-storm' },
  99: { desc: 'Thunderstorm with heavy hail', dayIcon: '⛈️⚡', nightIcon: '⛈️⚡', theme: 'theme-storm' }
};

// Get Weather Info from Code
function getWeatherDetails(code, isDay = 1) {
  const meta = weatherCodeMap[code] || {
    desc: 'Partly Cloudy',
    dayIcon: '⛅',
    nightIcon: '☁️',
    theme: 'theme-clouds'
  };

  const icon = isDay === 1 ? meta.dayIcon : meta.nightIcon;
  const theme = isDay === 0 && meta.theme === 'theme-day-clear' ? 'theme-night-clear' : meta.theme;

  return {
    desc: meta.desc,
    icon,
    theme
  };
}

// Temperature Conversion
function convertTemp(tempC) {
  if (tempC === null || tempC === undefined || isNaN(tempC)) return '--';
  if (state.unit === 'f') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

// Wind Speed Conversion
function convertWind(speedKmh) {
  if (speedKmh === null || speedKmh === undefined || isNaN(speedKmh)) return '--';
  if (state.unit === 'f') {
    return `${Math.round(speedKmh * 0.621371)} mph`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

// Cardinal Wind Direction
function getWindDirection(deg) {
  if (deg === undefined || deg === null) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// AQI Interpretation
function getAQIInfo(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return { label: 'N/A', class: '', advice: 'Air quality data unavailable' };
  }
  if (aqi <= 50) return { label: 'Good', class: '', advice: 'Air quality is satisfactory & clean' };
  if (aqi <= 100) return { label: 'Moderate', class: 'moderate', advice: 'Acceptable; sensitive groups take care' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', class: 'unhealthy', advice: 'Sensitive people should reduce outdoor exertion' };
  if (aqi <= 200) return { label: 'Unhealthy', class: 'unhealthy', advice: 'Everyone may experience health effects' };
  if (aqi <= 300) return { label: 'Very Unhealthy', class: 'very-unhealthy', advice: 'Health warnings of emergency conditions' };
  return { label: 'Hazardous', class: 'hazardous', advice: 'Serious health alert: avoid going outdoors' };
}

// UV Index Interpretation
function getUVInfo(uv) {
  if (uv === null || uv === undefined || isNaN(uv)) {
    return { label: 'N/A', class: '', advice: 'No UV reading available' };
  }
  if (uv <= 2) return { label: 'Low', class: '', advice: 'No protection required' };
  if (uv <= 5) return { label: 'Moderate', class: 'moderate', advice: 'Wear sunglasses & SPF 30+' };
  if (uv <= 7) return { label: 'High', class: 'unhealthy', advice: 'Cover up, wear hat & use sunscreen' };
  if (uv <= 10) return { label: 'Very High', class: 'very-unhealthy', advice: 'Avoid midday sun, seek shade' };
  return { label: 'Extreme', class: 'hazardous', advice: 'Take full protective measures outdoors' };
}

// Show/Hide Helpers
function showLoading(show) {
  elements.loadingState.classList.toggle('hidden', !show);
  if (show) {
    elements.weatherContent.style.opacity = '0.4';
    elements.errorState.classList.add('hidden');
  } else {
    elements.weatherContent.style.opacity = '1';
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorState.classList.remove('hidden');
  showLoading(false);
}

function hideError() {
  elements.errorState.classList.add('hidden');
}

// Fetch City Autocomplete Suggestions
async function fetchSuggestions(query) {
  if (!query || query.trim().length < 2) {
    elements.suggestionsDropdown.innerHTML = '';
    elements.suggestionsDropdown.classList.add('hidden');
    return;
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      elements.suggestionsDropdown.innerHTML = '<div class="suggestion-item"><span class="suggestion-sub">No locations found. Check spelling.</span></div>';
      elements.suggestionsDropdown.classList.remove('hidden');
      return;
    }

    renderSuggestions(data.results);
  } catch (err) {
    console.warn('Autocomplete fetch error:', err);
  }
}

// Render Autocomplete Dropdown
function renderSuggestions(cities) {
  elements.suggestionsDropdown.innerHTML = '';
  state.selectedIndex = -1;

  cities.forEach((city) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    const flag = city.country_code
      ? city.country_code.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()))
      : '📍';

    const subParts = [city.admin1, city.country].filter(Boolean).join(', ');

    item.innerHTML = `
      <div>
        <div class="suggestion-main">${city.name}</div>
        <div class="suggestion-sub">${subParts}</div>
      </div>
      <span class="suggestion-flag">${flag}</span>
    `;

    item.addEventListener('click', () => {
      selectCity({
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude
      });
      elements.suggestionsDropdown.classList.add('hidden');
      elements.cityInput.value = '';
      elements.clearSearchBtn.classList.add('hidden');
    });

    elements.suggestionsDropdown.appendChild(item);
  });

  elements.suggestionsDropdown.classList.remove('hidden');
}

// Fetch Weather & Air Quality for Coordinates
async function fetchAllWeatherData(lat, lon, cityName, countryName, admin1 = '') {
  showLoading(true);
  hideError();

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`;

    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;

    // Fetch in parallel for high speed
    const [weatherRes, aqiRes] = await Promise.allSettled([
      fetch(weatherUrl),
      fetch(aqiUrl)
    ]);

    if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
      throw new Error('Failed to retrieve forecast data.');
    }

    const weatherData = await weatherRes.value.json();
    let aqiData = null;
    if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
      try {
        aqiData = await aqiRes.value.json();
      } catch (e) {
        console.warn('AQI parse error', e);
      }
    }

    state.weatherData = weatherData;
    state.airQualityData = aqiData;
    state.activeCity = {
      name: cityName,
      country: countryName,
      admin1,
      latitude: lat,
      longitude: lon
    };

    saveRecentCity(state.activeCity);
    renderDashboard();
    showLoading(false);
  } catch (err) {
    console.error('Fetch Weather Error:', err);
    showError(err.message || 'Unable to retrieve weather. Please check your internet connection.');
  }
}

// Select and load a city
function selectCity(city) {
  fetchAllWeatherData(city.latitude, city.longitude, city.name, city.country, city.admin1);
}

// Render Dashboard with Current State
function renderDashboard() {
  const { weatherData, airQualityData, activeCity } = state;
  if (!weatherData || !weatherData.current) return;

  const current = weatherData.current;
  const daily = weatherData.daily || {};
  const hourly = weatherData.hourly || {};

  const weatherMeta = getWeatherDetails(current.weather_code, current.is_day);

  // Update Body Theme
  document.body.className = weatherMeta.theme;

  // City & Country
  elements.cityName.textContent = activeCity.name;
  const locationDetails = [activeCity.admin1, activeCity.country].filter(Boolean).join(', ');
  elements.cityCountry.textContent = locationDetails || 'Live Location';

  // Local Time & Date from timezone
  const tz = weatherData.timezone || 'auto';
  try {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    elements.localTime.textContent = timeFormatter.format(now);
    elements.localDate.textContent = dateFormatter.format(now);
  } catch (e) {
    const d = new Date();
    elements.localTime.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.localDate.textContent = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Hero Card Main Info
  elements.mainWeatherIcon.textContent = weatherMeta.icon;
  elements.weatherDesc.textContent = weatherMeta.desc;
  elements.currentTemp.textContent = convertTemp(current.temperature_2m);
  elements.feelsLike.textContent = `Feels like ${convertTemp(current.apparent_temperature)}°`;

  // Day / Night Pill
  if (current.is_day === 1) {
    elements.dayNightPill.textContent = '☀️ Daytime';
  } else {
    elements.dayNightPill.textContent = '🌙 Nighttime';
  }

  // Daily High / Low
  if (daily.temperature_2m_max && daily.temperature_2m_max.length > 0) {
    elements.tempHigh.textContent = `${convertTemp(daily.temperature_2m_max[0])}°`;
    elements.tempLow.textContent = `${convertTemp(daily.temperature_2m_min[0])}°`;
  }

  // Last Updated
  const updateTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  elements.lastUpdated.textContent = updateTime;

  // 1. Humidity
  elements.humidityVal.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.humidityBar.style.width = `${Math.min(100, current.relative_humidity_2m)}%`;
  if (current.relative_humidity_2m < 35) {
    elements.humidityStatus.textContent = 'Dry & Crisp air';
  } else if (current.relative_humidity_2m <= 65) {
    elements.humidityStatus.textContent = 'Comfortable moisture';
  } else {
    elements.humidityStatus.textContent = 'Humid & sticky air';
  }

  // 2. Wind
  elements.windVal.textContent = convertWind(current.wind_speed_10m);
  const dirName = getWindDirection(current.wind_direction_10m);
  elements.windDirText.textContent = `Direction: ${dirName} (${current.wind_direction_10m}°)`;
  elements.windCompass.style.transform = `rotate(${current.wind_direction_10m}deg)`;

  if (current.wind_speed_10m < 12) {
    elements.windStatus.textContent = 'Light breeze';
  } else if (current.wind_speed_10m < 28) {
    elements.windStatus.textContent = 'Moderate wind';
  } else if (current.wind_speed_10m < 45) {
    elements.windStatus.textContent = 'Strong wind gusts';
  } else {
    elements.windStatus.textContent = 'Gale force winds';
  }

  // 3. UV Index
  const todayUv = daily.uv_index_max ? daily.uv_index_max[0] : 0;
  elements.uvVal.textContent = todayUv !== undefined ? todayUv.toFixed(1) : '--';
  const uvInfo = getUVInfo(todayUv);
  elements.uvBadge.textContent = uvInfo.label;
  elements.uvBadge.className = `status-badge ${uvInfo.class}`;
  elements.uvAdvice.textContent = uvInfo.advice;

  // 4. Air Quality
  const aqiVal = airQualityData && airQualityData.current ? airQualityData.current.us_aqi : null;
  elements.aqiVal.textContent = aqiVal !== null && aqiVal !== undefined ? Math.round(aqiVal) : '--';
  const aqiInfo = getAQIInfo(aqiVal);
  elements.aqiBadge.textContent = aqiInfo.label;
  elements.aqiBadge.className = `status-badge ${aqiInfo.class}`;
  elements.aqiStatus.textContent = aqiInfo.advice;

  // 5. Rain Probability
  const rainProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined)
    ? daily.precipitation_probability_max[0]
    : Math.round(current.precipitation > 0 ? 100 : 0);

  elements.rainVal.textContent = `${rainProb}%`;
  elements.rainBar.style.width = `${rainProb}%`;
  if (rainProb < 20) {
    elements.rainStatus.textContent = 'Minimal or no rain expected';
  } else if (rainProb < 50) {
    elements.rainStatus.textContent = 'Scattered showers possible';
  } else {
    elements.rainStatus.textContent = 'High probability of rain';
  }

  // 6. Pressure
  if (current.surface_pressure) {
    elements.pressureVal.textContent = `${Math.round(current.surface_pressure)} hPa`;
    if (current.surface_pressure > 1020) {
      elements.pressureStatus.textContent = 'High pressure: Clear skies';
    } else if (current.surface_pressure < 1005) {
      elements.pressureStatus.textContent = 'Low pressure: Rain/Storm possible';
    } else {
      elements.pressureStatus.textContent = 'Normal atmospheric pressure';
    }
  }

  // Render Hourly & Daily Forecasts
  renderHourlyForecast(hourly, weatherData.timezone);
  renderDailyForecast(daily);
}

// Render Hourly Slider (Next 24 hours)
function renderHourlyForecast(hourly, timezone) {
  elements.hourlyContainer.innerHTML = '';
  if (!hourly || !hourly.time || hourly.time.length === 0) return;

  const now = new Date();
  let currentIndex = 0;

  // Locate the index corresponding to the current hour
  for (let i = 0; i < hourly.time.length; i++) {
    const itemDate = new Date(hourly.time[i]);
    if (itemDate >= now) {
      currentIndex = i;
      break;
    }
  }

  // Display next 24 hours
  const hoursToShow = 24;
  for (let i = currentIndex; i < Math.min(currentIndex + hoursToShow, hourly.time.length); i++) {
    const timeStr = hourly.time[i];
    const dateObj = new Date(timeStr);
    const isNow = i === currentIndex;

    let hourLabel = 'Now';
    if (!isNow) {
      hourLabel = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    }

    const temp = hourly.temperature_2m[i];
    const code = hourly.weather_code[i];
    const rainProb = (hourly.precipitation_probability && hourly.precipitation_probability[i] !== undefined)
      ? hourly.precipitation_probability[i]
      : 0;

    // Estimate isDay by hour (6am - 6pm)
    const hour = dateObj.getHours();
    const isDay = hour >= 6 && hour < 18 ? 1 : 0;
    const weatherInfo = getWeatherDetails(code, isDay);

    const card = document.createElement('div');
    card.className = `hourly-item ${isNow ? 'now' : ''}`;
    card.innerHTML = `
      <span class="hourly-time">${hourLabel}</span>
      <span class="hourly-emoji" title="${weatherInfo.desc}">${weatherInfo.icon}</span>
      <span class="hourly-temp">${convertTemp(temp)}°</span>
      ${rainProb > 10 ? `<span class="hourly-rain">💧 ${rainProb}%</span>` : '<span class="hourly-rain">&nbsp;</span>'}
    `;

    elements.hourlyContainer.appendChild(card);
  }
}

// Render 7-Day Extended Forecast Table
function renderDailyForecast(daily) {
  elements.dailyContainer.innerHTML = '';
  if (!daily || !daily.time || daily.time.length === 0) return;

  // Find min and max across all 7 days for the range bar
  const allMins = daily.temperature_2m_min || [];
  const allMaxs = daily.temperature_2m_max || [];
  const weekMin = Math.min(...allMins);
  const weekMax = Math.max(...allMaxs);
  const weekSpan = Math.max(1, weekMax - weekMin);

  for (let i = 0; i < Math.min(7, daily.time.length); i++) {
    const dateStr = daily.time[i];
    const dateObj = new Date(dateStr + 'T12:00:00'); // avoid timezone shifts
    const isToday = i === 0;

    let dayName = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const code = daily.weather_code[i];
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];
    const rainProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[i] !== undefined)
      ? daily.precipitation_probability_max[i]
      : 0;

    const weatherInfo = getWeatherDetails(code, 1);

    // Range bar percentages
    const leftPercent = Math.max(0, Math.min(100, ((minTemp - weekMin) / weekSpan) * 100));
    const widthPercent = Math.max(10, Math.min(100 - leftPercent, ((maxTemp - minTemp) / weekSpan) * 100));

    const row = document.createElement('div');
    row.className = 'daily-row';
    row.innerHTML = `
      <div class="daily-day-info">
        <span class="daily-day-name">${dayName}</span>
        <span class="daily-date-sub">${dateFormatted}</span>
      </div>

      <div class="daily-condition">
        <span class="daily-emoji">${weatherInfo.icon}</span>
        <span class="daily-desc">${weatherInfo.desc}</span>
      </div>

      <div class="daily-bar-container">
        <span class="daily-temp-low">${convertTemp(minTemp)}°</span>
        <div class="daily-range-track">
          <div class="daily-range-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
        </div>
        <span class="daily-temp-high">${convertTemp(maxTemp)}°</span>
      </div>

      <div class="daily-extra">
        ${rainProb > 15 ? `<span class="daily-rain-chance">💧 ${rainProb}%</span>` : '<span class="daily-rain-chance" style="opacity:0.35;">-</span>'}
      </div>
    `;

    elements.dailyContainer.appendChild(row);
  }
}

// User Geolocation (GPS)
function detectUserLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      // Reverse geocoding via BigDataCloud free client API
      try {
        const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        if (revRes.ok) {
          const revData = await revRes.json();
          const cityName = revData.city || revData.locality || revData.principalSubdivision || 'Your Location';
          const country = revData.countryName || '';
          const admin1 = revData.principalSubdivision || '';
          fetchAllWeatherData(latitude, longitude, cityName, country, admin1);
          return;
        }
      } catch (err) {
        console.warn('Reverse geocode fallback:', err);
      }

      // Fallback if reverse geocode fails
      fetchAllWeatherData(latitude, longitude, 'My Location', `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
    },
    (err) => {
      showLoading(false);
      let msg = 'Could not access location.';
      if (err.code === 1) msg = 'Location access was denied. Please allow location or search your city.';
      else if (err.code === 2) msg = 'Location position unavailable. Try searching by city name.';
      showError(msg);
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// Recent Searches Management
function saveRecentCity(city) {
  if (!city || !city.name) return;

  // Avoid duplicates
  state.recentSearches = state.recentSearches.filter(
    (c) => !(c.name.toLowerCase() === city.name.toLowerCase() && c.country === city.country)
  );

  state.recentSearches.unshift({
    name: city.name,
    country: city.country,
    admin1: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude
  });

  if (state.recentSearches.length > 5) {
    state.recentSearches.pop();
  }

  localStorage.setItem('skycast_recent', JSON.stringify(state.recentSearches));
  renderRecentCities();
}

function renderRecentCities() {
  if (state.recentSearches.length === 0) {
    elements.recentContainer.classList.add('hidden');
    return;
  }

  elements.recentList.innerHTML = '';
  state.recentSearches.forEach((city) => {
    const btn = document.createElement('button');
    btn.className = 'city-chip';
    btn.textContent = city.name;
    btn.title = [city.name, city.admin1, city.country].filter(Boolean).join(', ');
    btn.addEventListener('click', () => selectCity(city));
    elements.recentList.appendChild(btn);
  });

  elements.recentContainer.classList.remove('hidden');
}

// Unit Toggle Handler
function setUnit(unit) {
  if (state.unit === unit) return;
  state.unit = unit;
  localStorage.setItem('skycast_unit', unit);

  elements.unitButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.unit === unit);
  });

  // Re-render dashboard instantly without network call
  if (state.weatherData) {
    renderDashboard();
  }
}

// Event Listeners Setup
function initEventListeners() {
  // City Input Autocomplete with Debounce
  elements.cityInput.addEventListener('input', (e) => {
    const val = e.target.value;
    elements.clearSearchBtn.classList.toggle('hidden', val.length === 0);

    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      fetchSuggestions(val);
    }, 280);
  });

  // Clear Input Button
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.cityInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    elements.suggestionsDropdown.innerHTML = '';
    elements.suggestionsDropdown.classList.add('hidden');
    elements.cityInput.focus();
  });

  // Search Button Click & Enter Key
  const handleSearchSubmit = () => {
    const query = elements.cityInput.value.trim();
    if (!query) return;

    elements.suggestionsDropdown.classList.add('hidden');
    fetchSuggestions(query).then(() => {
      const firstItem = elements.suggestionsDropdown.querySelector('.suggestion-item');
      if (firstItem) firstItem.click();
    });
  };

  elements.searchBtn.addEventListener('click', handleSearchSubmit);
  elements.cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!elements.cityInput.contains(e.target) && !elements.suggestionsDropdown.contains(e.target)) {
      elements.suggestionsDropdown.classList.add('hidden');
    }
  });

  // Geolocation Button
  elements.geoBtn.addEventListener('click', detectUserLocation);

  // Unit Switch Buttons
  elements.unitButtons.forEach((btn) => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  // Popular City Chips
  document.querySelectorAll('.city-chip[data-city]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cityName = chip.dataset.city;
      fetchCityAndSelect(cityName);
    });
  });
}

// Direct city lookup from popular chips
async function fetchCityAndSelect(cityName) {
  try {
    showLoading(true);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      selectCity(data.results[0]);
    } else {
      showError(`City "${cityName}" not found.`);
    }
  } catch (err) {
    showError('Failed to load city weather.');
  }
}

// Initialize Application
function initApp() {
  // Set initial unit toggle state
  elements.unitButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.unit === state.unit);
  });

  initEventListeners();
  renderRecentCities();

  // Load default initial city (or first recent city)
  if (state.recentSearches.length > 0) {
    selectCity(state.recentSearches[0]);
  } else {
    // Default to New Delhi
    fetchCityAndSelect('New Delhi');
  }
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
