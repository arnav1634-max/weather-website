"""
SkyCast Weather - Desktop GUI Application (Python Tkinter)
Requires no external pip dependencies (Uses Python standard library: tkinter, urllib, json)
Powered by Open-Meteo API
"""

import tkinter as tk
from tkinter import ttk, messagebox
import urllib.request
import urllib.parse
import json
import threading
from datetime import datetime

# WMO Weather Code Descriptions and Emojis
WEATHER_CODES = {
    0: ("Clear Sky", "☀️"),
    1: ("Mainly Clear", "🌤️"),
    2: ("Partly Cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Fog", "🌫️"),
    48: ("Depositing Rime Fog", "🌫️"),
    51: ("Light Drizzle", "🌦️"),
    53: ("Moderate Drizzle", "🌦️"),
    55: ("Dense Drizzle", "🌧️"),
    61: ("Slight Rain", "🌧️"),
    63: ("Moderate Rain", "🌧️"),
    65: ("Heavy Rain", "🌧️"),
    71: ("Slight Snow", "❄️"),
    73: ("Moderate Snow", "❄️"),
    75: ("Heavy Snow", "❄️"),
    80: ("Rain Showers", "🌧️"),
    81: ("Moderate Showers", "🌧️"),
    82: ("Violent Showers", "⛈️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm + Hail", "⛈️⚡"),
    99: ("Heavy Thunderstorm", "⛈️⚡")
}

def get_weather_desc(code):
    return WEATHER_CODES.get(code, ("Partly Cloudy", "⛅"))

class WeatherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("SkyCast Weather App")
        self.root.geometry("640x720")
        self.root.configure(bg="#0f172a")
        self.root.resizable(False, False)

        self.current_unit = "C"

        self.create_widgets()
        # Load initial city
        self.search_weather("New Delhi")

    def create_widgets(self):
        # Header Frame
        header = tk.Frame(self.root, bg="#0f172a")
        header.pack(fill="x", padx=24, pady=(20, 10))

        title_lbl = tk.Label(header, text="⛅ SkyCast Weather", font=("Segoe UI", 18, "bold"), fg="#38bdf8", bg="#0f172a")
        title_lbl.pack(side="left")

        # Search Bar Frame
        search_frame = tk.Frame(self.root, bg="#1e293b", bd=0, highlightthickness=1, highlightbackground="#334155")
        search_frame.pack(fill="x", padx=24, pady=10)

        self.city_entry = tk.Entry(search_frame, font=("Segoe UI", 12), bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0)
        self.city_entry.pack(side="left", fill="x", expand=True, padx=12, pady=8)
        self.city_entry.insert(0, "New Delhi")
        self.city_entry.bind("<Return>", lambda e: self.on_search())

        search_btn = tk.Button(search_frame, text="Search", font=("Segoe UI", 10, "bold"), bg="#0284c7", fg="white", activebackground="#0369a1", bd=0, padx=14, pady=6, cursor="hand2", command=self.on_search)
        search_btn.pack(side="right", padx=4, pady=4)

        # Popular Quick Buttons
        quick_frame = tk.Frame(self.root, bg="#0f172a")
        quick_frame.pack(fill="x", padx=24, pady=2)

        tk.Label(quick_frame, text="Popular:", font=("Segoe UI", 9, "bold"), fg="#94a3b8", bg="#0f172a").pack(side="left", padx=(0, 6))
        for city in ["Delhi", "Mumbai", "London", "New York", "Tokyo"]:
            b = tk.Button(quick_frame, text=city, font=("Segoe UI", 8), bg="#1e293b", fg="#cbd5e1", activebackground="#334155", bd=0, padx=8, pady=2, cursor="hand2", command=lambda c=city: self.search_weather(c))
            b.pack(side="left", padx=3)

        # Status / Feedback label
        self.status_lbl = tk.Label(self.root, text="", font=("Segoe UI", 9), fg="#38bdf8", bg="#0f172a")
        self.status_lbl.pack(pady=4)

        # Main Weather Display Card
        self.card = tk.Frame(self.root, bg="#1e293b", highlightthickness=1, highlightbackground="#334155")
        self.card.pack(fill="x", padx=24, pady=10)

        self.city_lbl = tk.Label(self.card, text="--", font=("Segoe UI", 20, "bold"), fg="#ffffff", bg="#1e293b")
        self.city_lbl.pack(pady=(16, 2))

        self.country_lbl = tk.Label(self.card, text="--", font=("Segoe UI", 11), fg="#94a3b8", bg="#1e293b")
        self.country_lbl.pack()

        # Center Emoji + Temperature
        mid_frame = tk.Frame(self.card, bg="#1e293b")
        mid_frame.pack(pady=12)

        self.icon_lbl = tk.Label(mid_frame, text="☀️", font=("Segoe UI", 48), bg="#1e293b", fg="white")
        self.icon_lbl.pack(side="left", padx=16)

        self.temp_lbl = tk.Label(mid_frame, text="--°C", font=("Segoe UI", 44, "bold"), fg="#ffffff", bg="#1e293b")
        self.temp_lbl.pack(side="left", padx=16)

        self.desc_lbl = tk.Label(self.card, text="Clear Sky", font=("Segoe UI", 13, "bold"), fg="#38bdf8", bg="#1e293b")
        self.desc_lbl.pack(pady=(0, 4))

        self.feels_lbl = tk.Label(self.card, text="Feels like: --°C | H: --°C  L: --°C", font=("Segoe UI", 10), fg="#94a3b8", bg="#1e293b")
        self.feels_lbl.pack(pady=(0, 16))

        # Metrics Details Grid
        details_grid = tk.Frame(self.root, bg="#0f172a")
        details_grid.pack(fill="x", padx=24, pady=6)
        details_grid.columnconfigure((0, 1, 2), weight=1)

        # Humidity Card
        self.hum_box = self.create_metric_box(details_grid, "Humidity", "💧", "--%", 0)
        # Wind Card
        self.wind_box = self.create_metric_box(details_grid, "Wind Speed", "💨", "-- km/h", 1)
        # Rain Card
        self.rain_box = self.create_metric_box(details_grid, "Precipitation", "🌧️", "-- mm", 2)

        # 5-Day Forecast Frame
        forecast_container = tk.Frame(self.root, bg="#1e293b", highlightthickness=1, highlightbackground="#334155")
        forecast_container.pack(fill="both", expand=True, padx=24, pady=(10, 20))

        tk.Label(forecast_container, text="📅 5-Day Weather Forecast", font=("Segoe UI", 11, "bold"), fg="#ffffff", bg="#1e293b").pack(anchor="w", padx=14, pady=(10, 6))

        self.forecast_list_frame = tk.Frame(forecast_container, bg="#1e293b")
        self.forecast_list_frame.pack(fill="both", expand=True, padx=14, pady=(0, 10))

    def create_metric_box(self, parent, title, icon, default_val, col):
        box = tk.Frame(parent, bg="#1e293b", highlightthickness=1, highlightbackground="#334155", padx=10, pady=10)
        box.grid(row=0, column=col, sticky="ew", padx=4)

        t_lbl = tk.Label(box, text=f"{icon} {title}", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b")
        t_lbl.pack()

        val_lbl = tk.Label(box, text=default_val, font=("Segoe UI", 13, "bold"), fg="#ffffff", bg="#1e293b")
        val_lbl.pack(pady=(4, 0))
        return val_lbl

    def on_search(self):
        city = self.city_entry.get().strip()
        if not city:
            messagebox.showwarning("Warning", "Please enter a city name.")
            return
        self.search_weather(city)

    def search_weather(self, city_name):
        self.status_lbl.config(text=f"Searching for {city_name}...", fg="#38bdf8")
        threading.Thread(target=self._fetch_data_thread, args=(city_name,), daemon=True).start()

    def _fetch_data_thread(self, city_name):
        try:
            # 1. Geocoding
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city_name)}&count=1&language=en&format=json"
            req = urllib.request.Request(geo_url, headers={'User-Agent': 'SkyCastApp/1.0'})
            with urllib.request.urlopen(req, timeout=8) as response:
                geo_data = json.loads(response.read().decode('utf-8'))

            if not geo_data.get("results"):
                self.root.after(0, lambda: self.status_lbl.config(text=f"City '{city_name}' not found.", fg="#f87171"))
                return

            city_info = geo_data["results"][0]
            lat = city_info["latitude"]
            lon = city_info["longitude"]
            city_disp = city_info.get("name", city_name)
            country_disp = f"{city_info.get('admin1', '')}, {city_info.get('country', '')}".strip(', ')

            # 2. Weather Forecast
            w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto"
            req_w = urllib.request.Request(w_url, headers={'User-Agent': 'SkyCastApp/1.0'})
            with urllib.request.urlopen(req_w, timeout=8) as response:
                w_data = json.loads(response.read().decode('utf-8'))

            self.root.after(0, lambda: self.update_ui(city_disp, country_disp, w_data))
        except Exception as e:
            self.root.after(0, lambda: self.status_lbl.config(text=f"Connection Error: {str(e)}", fg="#f87171"))

    def update_ui(self, city_name, country_name, data):
        self.status_lbl.config(text="Live data updated successfully!", fg="#4ade80")

        current = data.get("current", {})
        daily = data.get("daily", {})

        self.city_lbl.config(text=city_name)
        self.country_lbl.config(text=country_name or "Global Location")

        temp = round(current.get("temperature_2m", 0))
        feels = round(current.get("apparent_temperature", 0))
        code = current.get("weather_code", 0)
        desc, emoji = get_weather_desc(code)

        self.temp_lbl.config(text=f"{temp}°C")
        self.icon_lbl.config(text=emoji)
        self.desc_lbl.config(text=desc)

        high = round(daily["temperature_2m_max"][0]) if daily.get("temperature_2m_max") else "--"
        low = round(daily["temperature_2m_min"][0]) if daily.get("temperature_2m_min") else "--"
        self.feels_lbl.config(text=f"Feels like: {feels}°C | High: {high}°C  Low: {low}°C")

        # Metric updates
        self.hum_box.config(text=f"{current.get('relative_humidity_2m', '--')}%")
        self.wind_box.config(text=f"{round(current.get('wind_speed_10m', 0))} km/h")
        self.rain_box.config(text=f"{current.get('precipitation', 0)} mm")

        # Update 5-day forecast list
        for widget in self.forecast_list_frame.winfo_children():
            widget.destroy()

        if daily and daily.get("time"):
            for i in range(min(5, len(daily["time"]))):
                date_str = daily["time"][i]
                d_obj = datetime.strptime(date_str, "%Y-%m-%d")
                day_title = "Today" if i == 0 else d_obj.strftime("%A")
                d_code = daily["weather_code"][i]
                d_desc, d_emoji = get_weather_desc(d_code)
                d_max = round(daily["temperature_2m_max"][i])
                d_min = round(daily["temperature_2m_min"][i])

                row = tk.Frame(self.forecast_list_frame, bg="#1e293b")
                row.pack(fill="x", pady=3)

                tk.Label(row, text=f"{day_title:<10}", font=("Segoe UI", 10, "bold"), fg="#e2e8f0", bg="#1e293b", width=12, anchor="w").pack(side="left")
                tk.Label(row, text=f"{d_emoji} {d_desc:<16}", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b", width=22, anchor="w").pack(side="left")
                tk.Label(row, text=f"H: {d_max}°C  L: {d_min}°C", font=("Segoe UI", 10, "bold"), fg="#38bdf8", bg="#1e293b", anchor="e").pack(side="right")

if __name__ == "__main__":
    root = tk.Tk()
    app = WeatherApp(root)
    root.mainloop()
