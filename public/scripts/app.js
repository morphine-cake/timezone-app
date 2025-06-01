class TimezoneApp {
  constructor() {
    this.cities = [];
    this.selectedCities = [];
    this.recentCities = [];
    this.userTimezone = null;
    this.userLocation = null;
    this.updateInterval = null;
    this.customTime = null;
    this.isUsingCustomTime = false;
    this.originalTime = null; // Store original current time for comparison

    // Popular cities for suggestions
    this.popularCityIds = [
      "new-york",
      "london",
      "tokyo",
      "paris",
      "sydney",
      "dubai",
      "singapore",
      "mumbai",
      "los-angeles",
      "berlin",
      "toronto",
      "shanghai",
      "beijing",
      "hong-kong",
      "bangkok",
    ];

    // Initialize elements after DOM is ready
    this.initializeElements();
    this.init();
  }

  initializeElements() {
    this.elements = {
      searchInput: document.getElementById("city-search"),
      searchSuggestions: document.getElementById("search-suggestions"),
      timezoneGrid: document.getElementById("timezone-grid"),
      emptyState: document.querySelector(".empty-state"),
      customTimeInput: document.getElementById("custom-time-input"),
      currentTimeBtn: document.getElementById("current-time-btn"),
      userLocation: document.getElementById("user-location"),
      locationStatusText: document.getElementById("location-status-text"),
      locationCity: document.getElementById("location-city"),
      locationCountry: document.getElementById("location-country"),
      addCityBtn: document.getElementById("add-city-btn"),
      cityModal: document.getElementById("city-modal"),
      modalClose: document.getElementById("modal-close"),
      popularCities: document.getElementById("popular-cities"),
      recentCities: document.getElementById("recent-cities"),
      recentCitiesSection: document.getElementById("recent-cities-section"),
    };

    // Check for missing elements
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.error(`Element not found: ${key}`);
      } else {
        console.log(`Element found: ${key}`, element);
      }
    });
  }

  async init() {
    try {
      await this.loadCities();
      this.loadSelectedCities();
      await this.detectUserLocation();
      this.initializeTimeInputs();
      this.setupEventListeners();
      this.startRealTimeUpdates();
      this.renderCities();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.showError("Failed to load application. Please refresh the page.");
    }
  }

  initializeTimeInputs() {
    const now = new Date();
    // Set current time (rounded to nearest minute)
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    this.elements.customTimeInput.value = currentTime;

    // Store the original current time for comparison
    this.originalTime = {
      date: now.toISOString().split("T")[0],
      time: currentTime,
    };

    // Initialize as using current time
    this.isUsingCustomTime = false;
    this.customTime = null;

    // Hide custom mode text initially
    this.elements.currentTimeBtn.classList.remove("active");
  }

  async loadCities() {
    try {
      const response = await fetch("/api/cities");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.cities = await response.json();
    } catch (error) {
      console.error("Error loading cities:", error);
      throw error;
    }
  }

  loadSelectedCities() {
    try {
      const saved = localStorage.getItem("selectedCities");
      if (saved) {
        this.selectedCities = JSON.parse(saved);
      }

      const savedRecent = localStorage.getItem("recentCities");
      if (savedRecent) {
        this.recentCities = JSON.parse(savedRecent);
      }
    } catch (error) {
      console.error("Error loading saved cities:", error);
      this.selectedCities = [];
      this.recentCities = [];
    }
  }

  saveSelectedCities() {
    try {
      localStorage.setItem(
        "selectedCities",
        JSON.stringify(this.selectedCities)
      );
      localStorage.setItem("recentCities", JSON.stringify(this.recentCities));
    } catch (error) {
      console.error("Error saving cities:", error);
    }
  }

  setupEventListeners() {
    // Modal controls
    this.elements.addCityBtn.addEventListener(
      "click",
      this.openModal.bind(this)
    );
    this.elements.modalClose.addEventListener(
      "click",
      this.closeModal.bind(this)
    );
    this.elements.cityModal.addEventListener("click", (e) => {
      if (e.target === this.elements.cityModal) {
        this.closeModal();
      }
    });

    // Search input
    this.elements.searchInput.addEventListener(
      "input",
      this.handleSearchInput.bind(this)
    );
    this.elements.searchInput.addEventListener(
      "keydown",
      this.handleSearchKeydown.bind(this)
    );
    this.elements.searchInput.addEventListener("blur", () => {
      // Delay hiding suggestions to allow for clicks
      setTimeout(() => this.hideSuggestions(), 200);
    });

    // Custom time inputs
    this.elements.customTimeInput.addEventListener(
      "change",
      this.handleCustomTimeChange.bind(this)
    );

    // Current time button
    this.elements.currentTimeBtn.addEventListener(
      "click",
      this.returnToCurrentTime.bind(this)
    );

    // Click outside to close suggestions
    document.addEventListener("click", (e) => {
      if (
        !this.elements.searchInput.contains(e.target) &&
        !this.elements.searchSuggestions.contains(e.target)
      ) {
        this.hideSuggestions();
      }
    });

    // Keyboard navigation for modal
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.elements.cityModal.classList.contains("active")
      ) {
        this.closeModal();
      }
    });
  }

  handleSearchInput(e) {
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }

    const filteredCities = this.cities
      .filter((city) => {
        const isAlreadySelected = this.selectedCities.some(
          (selected) => selected.id === city.id
        );
        const matchesQuery =
          city.name.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query);
        return !isAlreadySelected && matchesQuery;
      })
      .slice(0, 8); // Limit to 8 results

    this.showSuggestions(filteredCities);
  }

  handleSearchKeydown(e) {
    const suggestions = this.elements.searchSuggestions.querySelectorAll(
      ".search-suggestions__item"
    );
    const highlighted =
      this.elements.searchSuggestions.querySelector(".highlighted");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (highlighted) {
          const next = highlighted.nextElementSibling;
          if (next) {
            highlighted.classList.remove("highlighted");
            next.classList.add("highlighted");
          }
        } else if (suggestions.length > 0) {
          suggestions[0].classList.add("highlighted");
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (highlighted) {
          const prev = highlighted.previousElementSibling;
          if (prev) {
            highlighted.classList.remove("highlighted");
            prev.classList.add("highlighted");
          }
        }
        break;

      case "Enter":
        e.preventDefault();
        if (highlighted) {
          const cityId = highlighted.dataset.cityId;
          this.addCity(cityId);
        }
        break;

      case "Escape":
        this.hideSuggestions();
        this.elements.searchInput.blur();
        break;
    }
  }

  showSuggestions(cities) {
    if (cities.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.elements.searchSuggestions.innerHTML = cities
      .map(
        (city) => `
      <li class="search-suggestions__item" data-city-id="${city.id}" tabindex="0">
        <div class="search-suggestions__city">${city.name}</div>
        <div class="search-suggestions__country">${city.country}</div>
      </li>
    `
      )
      .join("");

    // Add click listeners
    this.elements.searchSuggestions
      .querySelectorAll(".search-suggestions__item")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          this.addCity(e.currentTarget.dataset.cityId);
        });
      });

    this.elements.searchSuggestions.classList.add("show");
    this.elements.searchInput.setAttribute("aria-expanded", "true");
  }

  hideSuggestions() {
    this.elements.searchSuggestions.classList.remove("show");
    this.elements.searchInput.setAttribute("aria-expanded", "false");
  }

  addCity(cityId) {
    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return;

    this.selectedCities.push(city);

    // Add to recent cities (remove if already exists, then add to front)
    this.recentCities = this.recentCities.filter((id) => id !== cityId);
    this.recentCities.unshift(cityId);

    // Keep only last 10 recent cities
    this.recentCities = this.recentCities.slice(0, 10);

    this.saveSelectedCities();
    this.renderCities();

    // Clear search
    this.elements.searchInput.value = "";
    this.hideSuggestions();
  }

  removeCity(cityId) {
    this.selectedCities = this.selectedCities.filter(
      (city) => city.id !== cityId
    );
    this.saveSelectedCities();
    this.renderCities();
  }

  handleCustomTimeChange() {
    const currentTime = this.elements.customTimeInput.value;

    // Check if user has changed from the original current time
    const hasChanged = currentTime !== this.originalTime.time;

    if (hasChanged) {
      this.isUsingCustomTime = true;
      this.updateCustomTime();
      this.elements.currentTimeBtn.classList.add("active");
    } else {
      this.isUsingCustomTime = false;
      this.customTime = null;
      this.elements.currentTimeBtn.classList.remove("active");
    }

    this.renderCities();
  }

  updateCustomTime() {
    if (!this.isUsingCustomTime) {
      this.customTime = null;
      return;
    }

    const time = this.elements.customTimeInput.value;

    if (time) {
      // Create a datetime string and parse it
      const dateTimeString = `${this.originalTime.date}T${time}:00`;
      this.customTime = new Date(dateTimeString);
    } else {
      this.customTime = null;
    }
  }

  getCurrentEffectiveTime() {
    if (this.isUsingCustomTime && this.customTime) {
      return this.customTime;
    }
    return new Date();
  }

  getTimeForTimezone(timezone) {
    const baseTime = this.getCurrentEffectiveTime();

    if (this.isUsingCustomTime && this.customTime && this.userTimezone) {
      // Calculate the time in the target timezone based on the custom time in user's timezone
      const userDateTime = luxon.DateTime.fromJSDate(this.customTime, {
        zone: this.userTimezone,
      });
      return userDateTime.setZone(timezone);
    }

    // Default: use current time in the target timezone
    return luxon.DateTime.now().setZone(timezone);
  }

  async detectUserLocation() {
    const statusText = this.elements.locationStatusText;

    try {
      // First, try to get timezone from browser
      this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Extract city from timezone as initial fallback
      const timezoneCityName = this.getCityFromTimezone(this.userTimezone);

      // Try to get geolocation for more precise location
      if (navigator.geolocation) {
        statusText.textContent = "detecting...";

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        });

        // Use reverse geocoding to get city name (simplified approach)
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const cityName = await this.getCityFromCoordinates(lat, lng);

        this.userLocation = {
          city: cityName || timezoneCityName,
          country: this.getCountryFromTimezone(this.userTimezone),
          timezone: this.userTimezone,
          coordinates: { lat, lng },
        };

        statusText.textContent = "";
        this.elements.locationCity.textContent = this.userLocation.city;
        this.elements.locationCountry.textContent = this.userLocation.country;
      } else {
        // Fallback to timezone-based city detection
        this.userLocation = {
          city: timezoneCityName,
          country: this.getCountryFromTimezone(this.userTimezone),
          timezone: this.userTimezone,
        };

        statusText.textContent = "";
        this.elements.locationCity.textContent = this.userLocation.city;
        this.elements.locationCountry.textContent = this.userLocation.country;
      }
    } catch (error) {
      console.error("Error detecting location:", error);

      // Fallback to browser timezone
      this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneCityName = this.getCityFromTimezone(this.userTimezone);

      this.userLocation = {
        city: timezoneCityName,
        country: this.getCountryFromTimezone(this.userTimezone),
        timezone: this.userTimezone,
      };

      statusText.textContent = "detection failed";
      this.elements.locationCity.textContent = this.userLocation.city;
      this.elements.locationCountry.textContent = this.userLocation.country;
    }
  }

  getCityFromTimezone(timezone) {
    // Extract city name from timezone string
    const parts = timezone.split("/");
    if (parts.length >= 2) {
      // Handle cases like "America/New_York" -> "New York"
      return parts[parts.length - 1].replace(/_/g, " ");
    }
    return "Your City";
  }

  async getCityFromCoordinates(lat, lng) {
    // Enhanced city detection based on coordinates
    const majorCities = [
      {
        name: "New York",
        lat: 40.7128,
        lng: -74.006,
        timezone: "America/New_York",
      },
      {
        name: "Los Angeles",
        lat: 34.0522,
        lng: -118.2437,
        timezone: "America/Los_Angeles",
      },
      {
        name: "Chicago",
        lat: 41.8781,
        lng: -87.6298,
        timezone: "America/Chicago",
      },
      {
        name: "Houston",
        lat: 29.7604,
        lng: -95.3698,
        timezone: "America/Chicago",
      },
      {
        name: "Phoenix",
        lat: 33.4484,
        lng: -112.074,
        timezone: "America/Phoenix",
      },
      {
        name: "Philadelphia",
        lat: 39.9526,
        lng: -75.1652,
        timezone: "America/New_York",
      },
      {
        name: "San Antonio",
        lat: 29.4241,
        lng: -98.4936,
        timezone: "America/Chicago",
      },
      {
        name: "San Diego",
        lat: 32.7157,
        lng: -117.1611,
        timezone: "America/Los_Angeles",
      },
      {
        name: "Dallas",
        lat: 32.7767,
        lng: -96.797,
        timezone: "America/Chicago",
      },
      {
        name: "San Jose",
        lat: 37.3382,
        lng: -121.8863,
        timezone: "America/Los_Angeles",
      },
      {
        name: "Austin",
        lat: 30.2672,
        lng: -97.7431,
        timezone: "America/Chicago",
      },
      {
        name: "Miami",
        lat: 25.7617,
        lng: -80.1918,
        timezone: "America/New_York",
      },
      {
        name: "Seattle",
        lat: 47.6062,
        lng: -122.3321,
        timezone: "America/Los_Angeles",
      },
      {
        name: "Denver",
        lat: 39.7392,
        lng: -104.9903,
        timezone: "America/Denver",
      },
      {
        name: "Boston",
        lat: 42.3601,
        lng: -71.0589,
        timezone: "America/New_York",
      },
      {
        name: "Toronto",
        lat: 43.6532,
        lng: -79.3832,
        timezone: "America/Toronto",
      },
      {
        name: "Vancouver",
        lat: 49.2827,
        lng: -123.1207,
        timezone: "America/Vancouver",
      },
      {
        name: "Montreal",
        lat: 45.5017,
        lng: -73.5673,
        timezone: "America/Toronto",
      },
      { name: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
      { name: "Paris", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
      { name: "Berlin", lat: 52.52, lng: 13.405, timezone: "Europe/Berlin" },
      { name: "Madrid", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid" },
      { name: "Rome", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome" },
      {
        name: "Amsterdam",
        lat: 52.3676,
        lng: 4.9041,
        timezone: "Europe/Amsterdam",
      },
      {
        name: "Brussels",
        lat: 50.8503,
        lng: 4.3517,
        timezone: "Europe/Brussels",
      },
      { name: "Vienna", lat: 48.2082, lng: 16.3738, timezone: "Europe/Vienna" },
      { name: "Zurich", lat: 47.3769, lng: 8.5417, timezone: "Europe/Zurich" },
      {
        name: "Stockholm",
        lat: 59.3293,
        lng: 18.0686,
        timezone: "Europe/Stockholm",
      },
      { name: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
      { name: "Osaka", lat: 34.6937, lng: 135.5023, timezone: "Asia/Tokyo" },
      { name: "Seoul", lat: 37.5665, lng: 126.978, timezone: "Asia/Seoul" },
      {
        name: "Beijing",
        lat: 39.9042,
        lng: 116.4074,
        timezone: "Asia/Shanghai",
      },
      {
        name: "Shanghai",
        lat: 31.2304,
        lng: 121.4737,
        timezone: "Asia/Shanghai",
      },
      {
        name: "Hong Kong",
        lat: 22.3193,
        lng: 114.1694,
        timezone: "Asia/Hong_Kong",
      },
      {
        name: "Singapore",
        lat: 1.3521,
        lng: 103.8198,
        timezone: "Asia/Singapore",
      },
      { name: "Mumbai", lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata" },
      { name: "Delhi", lat: 28.7041, lng: 77.1025, timezone: "Asia/Kolkata" },
      {
        name: "Bangalore",
        lat: 12.9716,
        lng: 77.5946,
        timezone: "Asia/Kolkata",
      },
      { name: "Chennai", lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
      { name: "Dubai", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" },
      {
        name: "Sydney",
        lat: -33.8688,
        lng: 151.2093,
        timezone: "Australia/Sydney",
      },
      {
        name: "Melbourne",
        lat: -37.8136,
        lng: 144.9631,
        timezone: "Australia/Melbourne",
      },
      {
        name: "Brisbane",
        lat: -27.4698,
        lng: 153.0251,
        timezone: "Australia/Brisbane",
      },
      {
        name: "Perth",
        lat: -31.9505,
        lng: 115.8605,
        timezone: "Australia/Perth",
      },
      {
        name: "Auckland",
        lat: -36.8485,
        lng: 174.7633,
        timezone: "Pacific/Auckland",
      },
      {
        name: "São Paulo",
        lat: -23.5505,
        lng: -46.6333,
        timezone: "America/Sao_Paulo",
      },
      {
        name: "Rio de Janeiro",
        lat: -22.9068,
        lng: -43.1729,
        timezone: "America/Sao_Paulo",
      },
      {
        name: "Buenos Aires",
        lat: -34.6118,
        lng: -58.396,
        timezone: "America/Argentina/Buenos_Aires",
      },
      {
        name: "Mexico City",
        lat: 19.4326,
        lng: -99.1332,
        timezone: "America/Mexico_City",
      },
      {
        name: "Istanbul",
        lat: 41.0082,
        lng: 28.9784,
        timezone: "Europe/Istanbul",
      },
      { name: "Moscow", lat: 55.7558, lng: 37.6173, timezone: "Europe/Moscow" },
      { name: "Cairo", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
      { name: "Lagos", lat: 6.5244, lng: 3.3792, timezone: "Africa/Lagos" },
      {
        name: "Johannesburg",
        lat: -26.2041,
        lng: 28.0473,
        timezone: "Africa/Johannesburg",
      },
    ];

    let closestCity = null;
    let minDistance = Infinity;

    majorCities.forEach((city) => {
      const distance = Math.sqrt(
        Math.pow((lat - city.lat) * 111, 2) + // Convert to km approximately
          Math.pow((lng - city.lng) * 111 * Math.cos((lat * Math.PI) / 180), 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });

    // If within ~50km of a major city, return it
    if (minDistance < 50) {
      return closestCity.name;
    }

    return null;
  }

  getCountryFromTimezone(timezone) {
    // Simple mapping of common timezones to countries
    const timezoneToCountry = {
      "America/New_York": "United States",
      "America/Los_Angeles": "United States",
      "America/Chicago": "United States",
      "America/Denver": "United States",
      "America/Phoenix": "United States",
      "America/Toronto": "Canada",
      "America/Vancouver": "Canada",
      "America/Montreal": "Canada",
      "Europe/London": "United Kingdom",
      "Europe/Paris": "France",
      "Europe/Berlin": "Germany",
      "Europe/Rome": "Italy",
      "Europe/Madrid": "Spain",
      "Europe/Amsterdam": "Netherlands",
      "Europe/Brussels": "Belgium",
      "Europe/Vienna": "Austria",
      "Europe/Zurich": "Switzerland",
      "Europe/Stockholm": "Sweden",
      "Europe/Istanbul": "Turkey",
      "Europe/Moscow": "Russia",
      "Asia/Tokyo": "Japan",
      "Asia/Shanghai": "China",
      "Asia/Seoul": "South Korea",
      "Asia/Mumbai": "India",
      "Asia/Kolkata": "India",
      "Asia/Dubai": "United Arab Emirates",
      "Asia/Singapore": "Singapore",
      "Asia/Hong_Kong": "Hong Kong",
      "Australia/Sydney": "Australia",
      "Australia/Melbourne": "Australia",
      "Australia/Brisbane": "Australia",
      "Australia/Perth": "Australia",
      "Pacific/Auckland": "New Zealand",
      "America/Sao_Paulo": "Brazil",
      "America/Argentina/Buenos_Aires": "Argentina",
      "America/Mexico_City": "Mexico",
      "Africa/Cairo": "Egypt",
      "Africa/Lagos": "Nigeria",
      "Africa/Johannesburg": "South Africa",
    };

    return (
      timezoneToCountry[timezone] || timezone.split("/")[0].replace("_", " ")
    );
  }

  async renderCities() {
    if (this.selectedCities.length === 0) {
      this.elements.timezoneGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🕐</div>
          <h2 class="empty-state__title">No cities selected</h2>
          <p class="empty-state__text">Add cities using the search above to start tracking their local times</p>
        </div>
      `;
      return;
    }

    const cityCards = await Promise.all(
      this.selectedCities.map(async (city) => {
        const cityTime = this.getTimeForTimezone(city.timezone);
        const timeDiff = this.userTimezone
          ? this.calculateTimeDifference(city.timezone, this.userTimezone)
          : null;
        const timeDiffText = timeDiff ? ` ${timeDiff.text}` : "";

        return `
          <div class="city-card">
            <div class="city-card__header">
              <div class="city-card__info">
                <h3 class="city-card__name">${city.name}</h3>
                <p class="city-card__country">${city.country}</p>
              </div>
              <button 
                class="city-card__remove" 
                onclick="app.removeCity('${city.id}')"
                aria-label="Remove ${city.name} from list"
                title="Remove city"
              >
                ✕
              </button>
            </div>
            
            <div class="city-card__time">
              <div class="city-card__current-time" data-timezone="${
                city.timezone
              }">
                ${this.formatTime(cityTime)}
                <span class="city-card__time-diff">${timeDiffText}</span>
              </div>
            </div>
          </div>
        `;
      })
    );

    this.elements.timezoneGrid.innerHTML = cityCards.join("");
  }

  calculateTimeDifference(cityTimezone, userTimezone) {
    if (!userTimezone) return null;

    const now = luxon.DateTime.now();
    const cityTime = now.setZone(cityTimezone);
    const userTime = now.setZone(userTimezone);

    const diffMinutes = cityTime.offset - userTime.offset;
    const diffHours = diffMinutes / 60;

    if (diffHours === 0) {
      return { text: "Same time", type: "same" };
    } else if (diffHours > 0) {
      const hours = Math.floor(Math.abs(diffHours));
      const minutes = Math.abs(diffMinutes) % 60;
      const timeStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      return { text: `${timeStr} ahead`, type: "ahead" };
    } else {
      const hours = Math.floor(Math.abs(diffHours));
      const minutes = Math.abs(diffMinutes) % 60;
      const timeStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      return { text: `${timeStr} behind`, type: "behind" };
    }
  }

  updateTimes() {
    if (this.isUsingCustomTime) {
      // In custom time mode, don't auto-update - user controls the time
      return;
    }

    const timeElements = document.querySelectorAll("[data-timezone]");
    timeElements.forEach((element) => {
      const timezone = element.dataset.timezone;
      const cityTime = this.getTimeForTimezone(timezone);
      element.textContent = this.formatTime(cityTime);
    });
  }

  startRealTimeUpdates() {
    // Update every minute, but only if using current time
    this.updateInterval = setInterval(() => {
      if (!this.isUsingCustomTime) {
        this.updateTimes();
      }
    }, 60000);

    // Also update on the next minute boundary
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
      if (!this.isUsingCustomTime) {
        this.updateTimes();
      }
      // Then start the regular interval
      clearInterval(this.updateInterval);
      this.updateInterval = setInterval(() => {
        if (!this.isUsingCustomTime) {
          this.updateTimes();
        }
      }, 60000);
    }, msUntilNextMinute);
  }

  showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 300px;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  formatTime(datetime) {
    return datetime.toLocaleString(luxon.DateTime.TIME_24_SIMPLE);
  }

  openModal() {
    console.log("Opening modal...");
    this.elements.cityModal.classList.add("active");
    this.elements.searchInput.value = "";
    this.hideSuggestions();
    this.populatePopularCities();
    this.populateRecentCities();
    // Focus on search input
    setTimeout(() => this.elements.searchInput.focus(), 100);
  }

  closeModal() {
    console.log("Closing modal...");
    this.elements.cityModal.classList.remove("active");
    this.elements.searchInput.value = "";
    this.hideSuggestions();
  }

  populatePopularCities() {
    const popularCities = this.cities.filter(
      (city) =>
        this.popularCityIds.includes(city.id) &&
        !this.selectedCities.some((selected) => selected.id === city.id)
    );

    this.elements.popularCities.innerHTML = popularCities
      .slice(0, 12) // Limit to 12 popular cities
      .map((city) => this.createSuggestionItem(city))
      .join("");

    // Add click listeners
    this.elements.popularCities
      .querySelectorAll(".suggestion-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          this.addCityFromSuggestion(item.dataset.cityId);
        });
      });
  }

  populateRecentCities() {
    if (this.recentCities.length === 0) {
      this.elements.recentCitiesSection.style.display = "none";
      return;
    }

    const recentCitiesData = this.recentCities
      .map((cityId) => this.cities.find((city) => city.id === cityId))
      .filter(
        (city) =>
          city &&
          !this.selectedCities.some((selected) => selected.id === city.id)
      )
      .slice(0, 6); // Limit to 6 recent cities

    if (recentCitiesData.length === 0) {
      this.elements.recentCitiesSection.style.display = "none";
      return;
    }

    this.elements.recentCitiesSection.style.display = "block";
    this.elements.recentCities.innerHTML = recentCitiesData
      .map((city) => this.createSuggestionItem(city))
      .join("");

    // Add click listeners
    this.elements.recentCities
      .querySelectorAll(".suggestion-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          this.addCityFromSuggestion(item.dataset.cityId);
        });
      });
  }

  createSuggestionItem(city) {
    return `
      <div class="suggestion-item" data-city-id="${city.id}" tabindex="0">
        <div class="suggestion-item__city">${city.name}</div>
        <div class="suggestion-item__country">${city.country}</div>
        <div class="suggestion-item__timezone">${city.timezone}</div>
      </div>
    `;
  }

  addCityFromSuggestion(cityId) {
    this.addCity(cityId);
    this.closeModal();
  }

  returnToCurrentTime() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    this.isUsingCustomTime = false;
    this.customTime = null;
    this.elements.customTimeInput.value = currentTime;
    this.elements.currentTimeBtn.classList.remove("active");

    // Update the original time for comparison
    this.originalTime = {
      date: now.toISOString().split("T")[0],
      time: currentTime,
    };

    this.renderCities();
  }
}

// Initialize the app when DOM is loaded
let app;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    app = new TimezoneApp();
  });
} else {
  app = new TimezoneApp();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (app) {
    app.destroy();
  }
});
