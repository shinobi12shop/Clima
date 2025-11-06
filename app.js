const API_KEY = "858bac0157784aa0fe36ec92a29ab744"
const OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather"

let map = null
let marker = null
let lastUpdateTime = null
const sidebarOpen = false

const $ = window.$
const L = window.L

document.addEventListener("DOMContentLoaded", () => {
  initializeMap()
  setupEventListeners()
  showInitialState()
  initializeMobileToggle()
  removeMapAttribution()
  autoDetectUserLocation()
})

function removeMapAttribution() {
  setTimeout(() => {
    if (map && map.attributionControl) {
      map.removeControl(map.attributionControl)
    }
    $(".leaflet-control-attribution").remove()
    $(".leaflet-control-attribution.leaflet-control").remove()
    $(".leaflet-bottom").remove()
    document.querySelectorAll(".leaflet-control-attribution").forEach((el) => el.remove())
    document.querySelectorAll(".leaflet-bottom").forEach((el) => (el.style.display = "none"))
  }, 100)

  setTimeout(() => {
    document.querySelectorAll(".leaflet-control-attribution, .leaflet-bottom").forEach((el) => {
      el.style.display = "none"
      el.remove()
    })
  }, 500)
}

function initializeMap() {
  map = L.map("map", {
    attributionControl: false,
    zoomControl: true,
    touchZoom: true,
    tap: true,
    dragging: true,
    touchExtend: true,
  }).setView([20, 0], 2)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    className: "map-tiles",
    attribution: "",
  }).addTo(map)

  map._container.style.touchAction = "manipulation"
}

function autoDetectUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        fetchWeatherByCoordinates(latitude, longitude)
      },
      () => {
        console.log("[v0] Geolocation failed, showing initial state")
        showInitialState()
      },
      { timeout: 10000, maximumAge: 0 },
    )
  } else {
    showInitialState()
  }
}

function setupEventListeners() {
  document.getElementById("searchBtn").addEventListener("click", performSearch)
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.which === 13) performSearch()
  })
  document.getElementById("geolocateBtn").addEventListener("click", getUserLocation)
}

function performSearch() {
  const city = document.getElementById("searchInput").value.trim()

  if (!city) {
    showError("Por favor ingresa una ciudad")
    return
  }

  fetchWeatherByCity(city)
}

function fetchWeatherByCity(city) {
  showLoading()

  $.ajax({
    url: OPENWEATHERMAP_URL,
    dataType: "json",
    data: {
      q: city,
      appid: API_KEY,
      units: "metric",
      lang: "es",
    },
    headers: {
      Accept: "application/json",
    },
    success: (data) => {
      displayWeather(data)
      document.getElementById("searchInput").value = ""
    },
    error: (xhr, status, error) => {
      if (xhr.status === 404) {
        showError("Ciudad no encontrada")
      } else if (xhr.status === 401) {
        showError("Clave API inválida")
      } else {
        showError("Error al obtener datos. Intenta más tarde.")
      }
    },
  })
}
// GEOLOCALIZACIÓN
function getUserLocation() {
  showLoading()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        fetchWeatherByCoordinates(latitude, longitude)
      },
      () => {
        showError("No se pudo acceder a tu ubicación")
      },
    )
  } else {
    showError("Geolocalización no soportada")
  }
}

function fetchWeatherByCoordinates(lat, lon) {
  $.ajax({
    url: OPENWEATHERMAP_URL,
    dataType: "json",
    data: {
      lat: lat,
      lon: lon,
      appid: API_KEY,
      units: "metric",
      lang: "es",
    },
    success: (data) => {
      displayWeather(data)
    },
    error: (xhr, status, error) => {
      showError("Error al obtener datos de clima")
    },
  })
}

// MOSTRAR INFORMACIÓN DEL CLIMA
function displayWeather(data) {
  const { name, sys, main, weather, wind } = data
  const { coord } = data

  document.getElementById("cityName").textContent = name
  document.getElementById("countryCode").textContent = sys.country
  document.getElementById("temperature").textContent = Math.round(main.temp)
  document.getElementById("feelsLike").textContent = "Sensación: " + Math.round(main.feels_like) + "°C"
  document.getElementById("description").textContent = weather[0].description
  document.getElementById("humidity").textContent = Math.round(main.humidity) + "%"
  document.getElementById("windSpeed").textContent = wind.speed.toFixed(1) + " m/s"
  document.getElementById("pressure").textContent = main.pressure + " hPa"

  lastUpdateTime = new Date()
  updateLastUpdatedTime()
  showWeatherInfo()
  updateMap(coord.lat, coord.lon, name)
}

function updateMap(lat, lon, cityName) {
  if (marker) {
    map.removeLayer(marker)
  }
  map.setView([lat, lon], 10)

  marker = L.marker([lat, lon]).addTo(map).bindPopup(`<strong>${cityName}</strong>`).openPopup()
}

function updateLastUpdatedTime() {
  if (!lastUpdateTime) return

  const now = new Date()
  const diff = Math.floor((now - lastUpdateTime) / 1000)

  let timeText
  if (diff < 60) {
    timeText = "Hace poco"
  } else if (diff < 3600) {
    timeText = `Hace ${Math.floor(diff / 60)} min`
  } else {
    timeText = `Hace ${Math.floor(diff / 3600)} hrs`
  }

  document.getElementById("lastUpdated").textContent = "Actualizado " + timeText
}

setInterval(updateLastUpdatedTime, 60000)

function showLoading() {
  document.getElementById("weatherInfo").classList.add("hidden")
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("initialState").classList.add("hidden")
  document.getElementById("loadingState").classList.remove("hidden")
}

function showWeatherInfo() {
  document.getElementById("loadingState").classList.add("hidden")
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("initialState").classList.add("hidden")
  document.getElementById("weatherInfo").classList.remove("hidden")
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message
  document.getElementById("weatherInfo").classList.add("hidden")
  document.getElementById("loadingState").classList.add("hidden")
  document.getElementById("initialState").classList.add("hidden")
  document.getElementById("errorState").classList.remove("hidden")
}

function showInitialState() {
  document.getElementById("loadingState").classList.add("hidden")
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("weatherInfo").classList.add("hidden")
  document.getElementById("initialState").classList.remove("hidden")
}

function initializeMobileToggle() {
  const toggleBtn = document.getElementById("toggleSidebarBtn")
  const sidebar = document.getElementById("sidebar")

  if (!toggleBtn || !sidebar) {
    console.error("[v0] Toggle button or sidebar not found")
    return
  }

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    const isActive = sidebar.classList.contains("active")

    if (isActive) {
      sidebar.classList.remove("active")
      toggleBtn.querySelector("i").classList.remove("fa-times")
      toggleBtn.querySelector("i").classList.add("fa-bars")
    } else {
      sidebar.classList.add("active")
      toggleBtn.querySelector("i").classList.remove("fa-bars")
      toggleBtn.querySelector("i").classList.add("fa-times")
    }
  })
  const mapContainer = document.querySelector(".map-container")
  if (mapContainer) {
    mapContainer.addEventListener("click", () => {
      if (window.innerWidth <= 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active")
        toggleBtn.querySelector("i").classList.remove("fa-times")
        toggleBtn.querySelector("i").classList.add("fa-bars")
      }
    })
  }

  const searchBtn = document.getElementById("searchBtn")
  const geolocateBtn = document.getElementById("geolocateBtn")

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768 && sidebar.classList.contains("active")) {
        setTimeout(() => {
          sidebar.classList.remove("active")
          toggleBtn.querySelector("i").classList.remove("fa-times")
          toggleBtn.querySelector("i").classList.add("fa-bars")
        }, 500)
      }
    })
  }

  if (geolocateBtn) {
    geolocateBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768 && sidebar.classList.contains("active")) {
        setTimeout(() => {
          sidebar.classList.remove("active")
          toggleBtn.querySelector("i").classList.remove("fa-times")
          toggleBtn.querySelector("i").classList.add("fa-bars")
        }, 500)
      }
    })
  }
}
