"use client";

import { MapPinIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatedTimeDisplay } from "./components/AnimatedTimeDisplay";
import { CitySelectionModal } from "./components/CitySelectionModal";
import { Footer } from "./components/Footer";
import { TimeSlider } from "./components/TimeSlider";

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

// Logo component with the provided SVG
const KairosLogo = () => (
  <div className="flex items-center justify-center">
    <svg
      width="139"
      height="34"
      viewBox="0 0 139 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.792 6.7998C25.129 6.7998 26.2127 7.88378 26.2129 9.2207C26.2129 10.5578 25.1291 11.6416 23.792 11.6416C22.4551 11.6414 21.3711 10.5577 21.3711 9.2207C21.3713 7.88389 22.4552 6.79998 23.792 6.7998Z"
        fill="#D9D9D9"
        style={{
          animation: "rotate 60s linear infinite",
          transformOrigin: "17px 17px",
        }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 0C26.3888 0 34 7.61116 34 17C34 26.3888 26.3888 34 17 34C7.61116 34 0 26.3888 0 17C0 7.61116 7.61116 0 17 0ZM17 0.679688C7.98671 0.679688 0.679688 7.98671 0.679688 17C0.679688 26.0133 7.98671 33.3203 17 33.3203C26.0133 33.3203 33.3203 26.0133 33.3203 17C33.3203 7.98671 26.0133 0.679688 17 0.679688Z"
        fill="#D9D9D9"
        style={{
          animation: "rotate 60s linear infinite",
          transformOrigin: "17px 17px",
        }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M115.688 10.499C116.921 10.499 117.901 10.6305 118.597 10.8916C119.312 11.1582 119.825 11.5383 120.123 12.0186C120.417 12.4933 120.566 13.0576 120.566 13.7002V20.2998C120.566 20.926 120.417 21.4886 120.125 21.9688C119.827 22.4581 119.314 22.8418 118.599 23.1084C117.904 23.3695 116.91 23.501 115.689 23.501C114.469 23.501 113.499 23.3695 112.803 23.1084C112.086 22.8418 111.577 22.4562 111.286 21.9668C111.001 21.4866 110.855 20.9261 110.855 20.2998V13.7021C110.855 13.0613 111.001 12.4954 111.286 12.0225C111.575 11.5404 112.086 11.16 112.801 10.8916C113.497 10.6305 114.454 10.499 115.688 10.499ZM115.688 11.0869C114.576 11.0869 113.695 11.2001 113.072 11.4229C112.471 11.6382 112.049 11.9397 111.818 12.3174C111.583 12.7045 111.463 13.1688 111.463 13.7002V20.2979C111.463 20.8145 111.584 21.2765 111.819 21.6709C112.049 22.0562 112.471 22.3597 113.072 22.5752C113.695 22.798 114.574 22.9111 115.688 22.9111H115.689C116.817 22.9111 117.704 22.7979 118.326 22.5752C118.928 22.3615 119.355 22.0561 119.593 21.6689C119.836 21.2746 119.959 20.8127 119.959 20.2979V13.7002C119.959 13.1706 119.836 12.7065 119.593 12.3193C119.355 11.9396 118.927 11.6383 118.325 11.4229C117.703 11.2001 116.799 11.0869 115.688 11.0869Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M68.8301 10.7676C69.3996 10.7676 69.8124 10.9374 70.0576 11.2695C70.2727 11.5635 70.4784 11.9362 70.667 12.3799L72.2617 16.0234L72.2598 16.0244C72.3899 16.3676 72.4879 16.7203 72.5596 17.0781C72.6313 17.4397 72.667 17.8383 72.667 18.2656V23.2119H72.0596V19.3662H63.4268V23.2119H62.8193V18.2656C62.8193 17.8383 62.8551 17.4379 62.9268 17.0781C62.9965 16.7186 63.0963 16.3662 63.2227 16.0322L64.7041 12.3594C64.8795 11.9286 65.0812 11.5595 65.3057 11.2656C65.5566 10.9352 65.9817 10.7676 66.5664 10.7676H68.8301ZM66.5684 11.3555C66.1667 11.3555 65.9001 11.4538 65.751 11.6582C65.5755 11.8992 65.4118 12.2104 65.2646 12.5811L63.7852 16.249C63.6833 16.5302 63.5962 16.8464 63.5283 17.1787C63.4623 17.5092 63.4287 17.8728 63.4287 18.2617V18.7734H72.0615V18.2617C72.0615 17.8728 72.0311 17.5071 71.9707 17.1748C71.9122 16.8463 71.822 16.5338 71.7051 16.249L70.1133 12.6084C69.9492 12.2341 69.775 11.9163 69.5996 11.668C69.4506 11.458 69.1998 11.3555 68.832 11.3555H66.5684Z"
        fill="white"
      />
      <path
        d="M46.6074 16.7168H51.3096L53.9658 10.7676H54.6318L51.9746 16.7168H52.6357C53.6279 16.7168 54.3766 16.8999 54.8633 17.2578H54.8613C55.3631 17.6285 55.6182 18.2454 55.6182 19.0908V23.209H55.0107V19.0908C55.0107 18.4316 54.8275 17.9826 54.4521 17.7178C54.0636 17.4439 53.4505 17.3047 52.6338 17.3047H46.6074V23.209H46V10.7676H46.6074V16.7168Z"
        fill="white"
      />
      <path
        d="M87.0186 11.3555H83.4834V22.6211H87.0186V23.209H79.293V22.6211H82.874V11.3555H79.293V10.7676H87.0186V11.3555Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M99.5137 10.7676C100.476 10.7676 101.197 11.0301 101.655 11.5469C102.108 12.0545 102.336 12.7121 102.336 13.499V15.042C102.336 15.7341 102.237 16.3206 102.045 16.7881C101.932 17.0649 101.753 17.2921 101.515 17.4727C103.163 17.6123 103.998 18.4709 103.998 20.0293V23.209H103.391V20.0293C103.391 18.6782 102.613 18.0206 101.016 18.0205H94.665V23.209H94.0576V10.7676H99.5137ZM94.665 17.4551H99.5137C100.4 17.4551 100.992 17.2538 101.277 16.8613C101.577 16.4468 101.728 15.8423 101.729 15.0645V13.499C101.728 12.8472 101.545 12.3215 101.187 11.9326C100.832 11.5493 100.27 11.3555 99.5137 11.3555H94.665V17.4551Z"
        fill="white"
      />
      <path
        d="M135.607 10.7676V11.3555H130.289C129.693 11.3555 129.216 11.5128 128.869 11.8213C128.522 12.1317 128.352 12.5114 128.352 12.9844V14.8174C128.352 15.2847 128.443 15.6061 128.618 15.7705C128.807 15.9476 129.065 16.0701 129.382 16.1377L134.255 17.0986C134.751 17.1954 135.169 17.4038 135.495 17.7197V17.7158C135.834 18.0464 136 18.618 136 19.4668V20.7637C136 21.4685 135.745 22.0583 135.247 22.5166C134.751 22.9729 134.078 23.205 133.246 23.2051H127.305V22.6172H133.246C133.918 22.6171 134.45 22.4418 134.827 22.0967C135.206 21.7498 135.391 21.3151 135.391 20.7656V19.4688C135.391 18.8205 135.279 18.3769 135.061 18.1523C134.834 17.9205 134.521 17.7619 134.131 17.6797L129.258 16.7188C128.826 16.6384 128.463 16.4687 128.184 16.2148C127.886 15.9446 127.742 15.4874 127.742 14.8174V12.9844C127.742 12.3379 127.982 11.7993 128.452 11.3848C128.918 10.9758 129.535 10.7677 130.289 10.7676H135.607Z"
        fill="white"
      />
    </svg>
  </div>
);

export default function Home() {
  // Layout constants
  const MAX_WIDTH = "560px";

  // Helper function to get user's local timezone city
  const getUserLocalCity = (): City => {
    if (typeof window === "undefined") {
      // Fallback for SSR
      return {
        id: "local",
        name: "Local Time",
        country: "Your Location",
        timezone: "Europe/Istanbul",
      };
    }

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Try to extract city name from timezone (e.g., "America/New_York" -> "New York")
    const timezoneParts = userTimezone.split("/");
    const cityPart = timezoneParts[timezoneParts.length - 1];
    let cityName = cityPart.replace(/_/g, " ");

    // Map timezone regions to more user-friendly country/region names
    const regionPart = timezoneParts[0];
    const regionMap: { [key: string]: string } = {
      America: "Americas",
      Europe: "Europe",
      Asia: "Asia",
      Africa: "Africa",
      Australia: "Australia",
      Pacific: "Pacific",
      Atlantic: "Atlantic",
      Indian: "Indian Ocean",
      Antarctica: "Antarctica",
    };

    // Special handling for common timezone mismatches
    const timezoneOverrides: {
      [key: string]: { city: string; country: string };
    } = {
      "Europe/Istanbul": { city: "Ankara", country: "Turkey" }, // Default to Ankara for Turkey
    };

    if (timezoneOverrides[userTimezone]) {
      cityName = timezoneOverrides[userTimezone].city;
      const countryName = timezoneOverrides[userTimezone].country;
      return {
        id: "local-user-timezone",
        name: cityName,
        country: countryName,
        timezone: userTimezone,
      };
    }

    const countryName = regionMap[regionPart] || regionPart.replace(/_/g, " ");

    return {
      id: "local-user-timezone",
      name: cityName || "Local Time",
      country: countryName || "Your Location",
      timezone: userTimezone,
    };
  };

  // Default cities if localStorage is empty - starts with user's local timezone
  const getDefaultCities = useCallback((): City[] => {
    const localCity = getUserLocalCity();

    return [
      localCity,
      {
        id: "dubai",
        name: "Dubai",
        country: "United Arab Emirates",
        timezone: "Asia/Dubai",
      },
      {
        id: "london",
        name: "London",
        country: "United Kingdom",
        timezone: "Europe/London",
      },
      {
        id: "tokyo",
        name: "Tokyo",
        country: "Japan",
        timezone: "Asia/Tokyo",
      },
      {
        id: "los-angeles",
        name: "Los Angeles",
        country: "United States",
        timezone: "America/Los_Angeles",
      },
      {
        id: "sydney",
        name: "Sydney",
        country: "Australia",
        timezone: "Australia/Sydney",
      },
    ];
  }, []);

  const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.now());
  const [timeOffset, setTimeOffset] = useState(0);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [draggedCityId, setDraggedCityId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropLinePosition, setDropLinePosition] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Set client flag after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cities from localStorage on component mount (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const savedCities = localStorage.getItem("kairos-selected-cities");
    if (savedCities) {
      try {
        const parsedCities = JSON.parse(savedCities);
        if (Array.isArray(parsedCities) && parsedCities.length > 0) {
          // Ensure the first city is always the user's local timezone
          const localCity = getUserLocalCity();
          const citiesWithoutLocal = parsedCities.filter(
            (city) => city.id !== "local-user-timezone"
          );
          setSelectedCities([localCity, ...citiesWithoutLocal]);
        } else {
          setSelectedCities(getDefaultCities());
        }
      } catch (error) {
        console.error("Error parsing saved cities:", error);
        setSelectedCities(getDefaultCities());
      }
    } else {
      // No saved cities, use defaults with user's local timezone
      setSelectedCities(getDefaultCities());
    }

    // Show loading for 800ms, then keep for additional 500ms before hiding
    const hideLoadingTimer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 1300); // 800ms loading + 500ms extra = 1300ms total

    return () => clearTimeout(hideLoadingTimer);
  }, [isClient, getDefaultCities]);

  // Save cities to localStorage whenever selectedCities changes (client-side only)
  useEffect(() => {
    if (!isClient || selectedCities.length === 0) return;

    // Don't save the local timezone city (first city) - it's generated dynamically
    const citiesToSave = selectedCities.filter(
      (city) => city.id !== "local-user-timezone"
    );

    localStorage.setItem(
      "kairos-selected-cities",
      JSON.stringify(citiesToSave)
    );
  }, [selectedCities, isClient]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(DateTime.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeOffsetChange = (offsetHours: number) => {
    setTimeOffset(offsetHours);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCities((prev) => [...prev, city]);
  };

  const handleCityRemove = (cityId: string) => {
    // Don't allow removing the local timezone city (reference city)
    if (cityId === "local-user-timezone") return;

    setSelectedCities((prev) => prev.filter((city) => city.id !== cityId));
  };

  const handleDragStart = (e: React.DragEvent, cityId: string) => {
    setDraggedCityId(cityId);
    e.dataTransfer.effectAllowed = "move";
    // Add some visual feedback
    e.dataTransfer.setData("text/plain", cityId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Don't allow dropping on the reference city (index 0)
    if (index === 0) return;

    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);

    // Show drop line indicator
    const draggedIndex = selectedCities.findIndex(
      (city) => city.id === draggedCityId
    );
    if (draggedIndex !== -1 && draggedIndex !== index) {
      // Show line above the target if dragging from below, below if dragging from above
      setDropLinePosition(draggedIndex < index ? index + 1 : index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropLinePosition(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedCityId) return;

    // Don't allow dropping on the reference city (index 0)
    if (dropIndex === 0) {
      setDraggedCityId(null);
      setDragOverIndex(null);
      return;
    }

    const draggedIndex = selectedCities.findIndex(
      (city) => city.id === draggedCityId
    );
    if (
      draggedIndex === -1 ||
      draggedIndex === dropIndex ||
      draggedIndex === 0
    ) {
      setDraggedCityId(null);
      setDragOverIndex(null);
      return;
    }

    // Create new array with reordered cities
    const newCities = [...selectedCities];
    const [draggedCity] = newCities.splice(draggedIndex, 1);
    newCities.splice(dropIndex, 0, draggedCity);

    setSelectedCities(newCities);
    setDraggedCityId(null);
    setDragOverIndex(null);
    setDropLinePosition(null);
  };

  const handleDragEnd = () => {
    setDraggedCityId(null);
    setDragOverIndex(null);
    setDropLinePosition(null);
  };

  const getAdjustedTime = (timezone: string) => {
    const baseTime = currentTime.plus({ hours: timeOffset });
    return baseTime.setZone(timezone);
  };

  const getTimeDifference = (timezone: string) => {
    // If this is the first city (user's reference), return "YOUR TIME"
    if (selectedCities.length > 0 && selectedCities[0].timezone === timezone) {
      return "YOUR TIME";
    }

    // Get the reference timezone (first city)
    const referenceTimezone = selectedCities[0]?.timezone || "Europe/Istanbul";

    // Calculate timezone offset difference
    const now = DateTime.now();
    const referenceOffset = now.setZone(referenceTimezone).offset;
    const cityOffset = now.setZone(timezone).offset;

    // Calculate the difference in hours
    const diffHours = Math.round((cityOffset - referenceOffset) / 60);

    // Get the official timezone abbreviation (e.g., AEDT, PST, IST, etc.)
    const adjustedTime = getAdjustedTime(timezone);
    const timezoneAbbreviation = adjustedTime.toFormat("ZZZZ");

    return `${
      diffHours >= 0 ? "+" : ""
    }${diffHours}H / ${timezoneAbbreviation}`;
  };

  // Loading screen component
  if (showLoadingScreen) {
    return (
      <div
        className="loading-screen"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          backgroundColor: "#121212",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "9999",
        }}
      >
        <div className="loading-content">
          {/* New Kairos Logo */}
          <div
            className="loading-logo"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/kairos-logo.png"
              alt="Kairos"
              width={318}
              height={78}
              style={{
                width: "auto",
                height: "110px",
              }}
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="kairos-app"
      className="kairos-app-container min-h-screen"
      style={{
        backgroundColor: "#121212",
        color: "#ffffff",
        animation: "fadeIn 0.6s ease-out",
      }}
    >
      {/* Sticky Header */}
      <header
        id="kairos-header"
        className="kairos-header w-full"
        style={{
          position: "sticky",
          top: "0",
          zIndex: "50",
          backgroundColor: "#121212",
          animation: "fadeIn 0.5s ease-out 0.2s both",
        }}
      >
        <div
          className="header-content-container"
          style={{
            maxWidth: MAX_WIDTH,
            margin: "0 auto",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          {/* Top Header Row */}
          <div
            id="header-content"
            className="header-content-wrapper w-full flex items-center justify-between py-6"
          >
            <div className="logo-container">
              <KairosLogo />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.08)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.04)";
              }}
              className="add-city-button transition-colors flex items-center justify-center"
              style={{
                color: "#ffffff",
                width: "32px",
                height: "32px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "transparent",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <PlusIcon
                className="plus-icon"
                style={{ width: "20px", height: "20px" }}
              />
            </button>
          </div>

          {/* Time Slider Row */}
          <div
            className="time-slider-wrapper"
            style={{ paddingTop: "24px", overflow: "hidden" }}
          >
            <TimeSlider
              onTimeOffsetChange={handleTimeOffsetChange}
              currentOffset={timeOffset}
            />
          </div>

          {/* Reference City Row */}
          {selectedCities.length > 0 && (
            <div
              className="reference-city-container border-b w-full"
              style={{
                borderBottomColor: "rgba(255, 255, 255, 0.25)",
                animation: "slideInUp 0.5s ease-out 0.4s both",
              }}
            >
              <div className="city-row flex justify-between items-center py-6 w-full">
                {/* City Info Section */}
                <div className="city-info-section flex items-center space-x-3">
                  <div className="city-details">
                    <h3
                      className="city-name text-white font-manrope"
                      style={{
                        fontSize: "24px",
                        lineHeight: "32px",
                        letterSpacing: "1px",
                        fontFamily: "var(--font-manrope)",
                        margin: "0",
                      }}
                    >
                      {selectedCities[0].name}
                    </h3>
                    <p
                      className="city-country uppercase font-fira-mono"
                      style={{
                        fontSize: "12px",
                        lineHeight: "14px",
                        letterSpacing: "1px",
                        fontFamily: "var(--font-fira-mono)",
                        color: "#ACACAC",
                        margin: "0",
                        marginTop: "6px",
                      }}
                    >
                      {selectedCities[0].country}
                    </p>
                  </div>
                </div>

                {/* Time Display Section */}
                <div className="time-display-section text-right">
                  <AnimatedTimeDisplay
                    timezone={selectedCities[0].timezone}
                    timeOffset={timeOffset}
                    className="current-time-display text-white font-manrope"
                    style={{
                      fontSize: "24px",
                      lineHeight: "32px",
                      letterSpacing: "2px",
                      fontFamily: "var(--font-manrope)",
                      margin: "0",
                    }}
                  />
                  <div
                    className="time-difference-display flex items-center justify-end uppercase font-fira-mono"
                    style={{
                      fontSize: "12px",
                      lineHeight: "14px",
                      letterSpacing: "1px",
                      fontFamily: "var(--font-fira-mono)",
                      color: "#ACACAC",
                      margin: "0",
                      marginTop: "6px",
                    }}
                  >
                    <MapPinIcon
                      className="your-time-pin-icon"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px",
                      }}
                    />
                    <span className="your-time-label">
                      {getTimeDifference(selectedCities[0].timezone)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="kairos-main-content mx-auto"
        style={{
          maxWidth: MAX_WIDTH,
          paddingLeft: "24px",
          paddingRight: "24px",
          animation: "fadeIn 0.6s ease-out 0.6s both",
        }}
      >
        {/* Additional Cities List (excluding reference city) */}
        <div className="cities-list-container space-y-0 w-full">
          {selectedCities.slice(1).map((city, index) => {
            const actualIndex = index + 1; // Adjust index since we're slicing the array
            // Show drop line above this city if needed
            const showDropLineAbove = dropLinePosition === actualIndex;
            const isHovered = hoveredCityId === city.id;
            const canDelete = true; // All cities in this list can be deleted (no reference city here)
            const canDrag = true; // All cities in this list can be dragged
            const isDragging = draggedCityId === city.id;
            const isDraggedOver = dragOverIndex === actualIndex;

            return (
              <React.Fragment key={city.id}>
                {/* Drop line indicator */}
                {showDropLineAbove && (
                  <div
                    className="drop-line"
                    style={{
                      height: "2px",
                      backgroundColor: "#FF7C35",
                      margin: "4px 0",
                      borderRadius: "1px",
                      transition: "all 0.2s ease-in-out",
                    }}
                  />
                )}
                <div
                  className="city-row-container relative overflow-hidden border-b w-full"
                  style={{
                    borderBottomColor: "rgba(255, 255, 255, 0.08)",
                    opacity: isDragging ? 0.5 : 1,
                    transform: isDraggedOver ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease-in-out",
                    backgroundColor: isDraggedOver
                      ? "rgba(255, 255, 255, 0.04)"
                      : "transparent",
                    animation: `slideInUp 0.4s ease-out ${
                      (index + 1) * 0.1
                    }s both`,
                  }}
                  draggable={canDrag}
                  onDragStart={
                    canDrag ? (e) => handleDragStart(e, city.id) : undefined
                  }
                  onDragOver={(e) => handleDragOver(e, actualIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, actualIndex)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={() => canDelete && setHoveredCityId(city.id)}
                  onMouseLeave={() => setHoveredCityId(null)}
                >
                  {/* Delete Button - slides in from left */}
                  {canDelete && (
                    <button
                      onClick={() => handleCityRemove(city.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.12)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                      }}
                      className="delete-button absolute left-0 top-1/2 flex items-center justify-center transition-all duration-300 ease-in-out z-10"
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "transparent",
                        borderRadius: "8px",
                        marginRight: "16px",
                        cursor: "pointer",
                        transform: isHovered
                          ? "translateX(0) translateY(-50%)"
                          : "translateX(-100%) translateY(-50%)",
                      }}
                    >
                      <TrashIcon
                        className="trash-icon text-white"
                        style={{ width: "20px", height: "20px" }}
                      />
                    </button>
                  )}

                  {/* Main Content - restructured for selective sliding */}
                  <div
                    className="city-row flex justify-between items-center py-6 w-full"
                    style={{
                      backgroundColor: "#121212",
                    }}
                  >
                    {/* City Info Section - slides right when delete button appears */}
                    <div
                      className="city-info-section flex items-center space-x-3 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          isHovered && canDelete
                            ? "translateX(48px)"
                            : "translateX(0)",
                        backgroundColor: "#121212",
                      }}
                    >
                      <div className="city-details">
                        <h3
                          className="city-name text-white font-manrope"
                          style={{
                            fontSize: "24px",
                            lineHeight: "32px",
                            letterSpacing: "1px",
                            fontFamily: "var(--font-manrope)",
                            margin: "0",
                          }}
                        >
                          {city.name}
                        </h3>
                        <p
                          className="city-country uppercase font-fira-mono"
                          style={{
                            fontSize: "12px",
                            lineHeight: "14px",
                            letterSpacing: "1px",
                            fontFamily: "var(--font-fira-mono)",
                            color: "#ACACAC",
                            margin: "0",
                            marginTop: "6px",
                          }}
                        >
                          {city.country}
                        </p>
                      </div>
                    </div>

                    {/* Time Display Section - stays in original position */}
                    <div className="time-display-section text-right">
                      <AnimatedTimeDisplay
                        timezone={city.timezone}
                        timeOffset={timeOffset}
                        className="current-time-display text-white font-manrope"
                        style={{
                          fontSize: "24px",
                          lineHeight: "32px",
                          letterSpacing: "2px",
                          fontFamily: "var(--font-manrope)",
                          margin: "0",
                        }}
                      />
                      <div
                        className="time-difference-display flex items-center justify-end uppercase font-fira-mono"
                        style={{
                          fontSize: "12px",
                          lineHeight: "14px",
                          letterSpacing: "1px",
                          fontFamily: "var(--font-fira-mono)",
                          color: "#ACACAC",
                          margin: "0",
                          marginTop: "6px",
                        }}
                      >
                        <span className="time-diff-label">
                          {getTimeDifference(city.timezone)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {/* Drop line at the end if needed */}
          {dropLinePosition === selectedCities.length && (
            <div
              className="drop-line"
              style={{
                height: "2px",
                backgroundColor: "#FF7C35",
                margin: "4px 0",
                borderRadius: "1px",
                transition: "all 0.2s ease-in-out",
              }}
            />
          )}
        </div>
      </main>

      {/* Spacer for fixed footer */}
      <div style={{ height: "80px" }} />

      {/* Footer */}
      <Footer />

      {/* City Selection Modal */}
      <CitySelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCitySelect={handleCitySelect}
        selectedCities={selectedCities}
      />
    </div>
  );
}
