"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelect: (city: City) => void;
  selectedCities: City[];
}

export function CitySelectionModal({
  isOpen,
  onClose,
  onCitySelect,
  selectedCities,
}: CitySelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const citiesListRef = useRef<HTMLDivElement>(null);

  // Handle modal opening/closing animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimating(true);
      // Small delay to ensure the modal is rendered before animation starts
      setTimeout(() => {
        setIsAnimating(false);
      }, 10);
    } else if (shouldRender) {
      setIsAnimating(true);
      // Delay hiding the modal until animation completes
      setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
      }, 300);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (isOpen && cities.length === 0) {
      fetchCities();
    }
  }, [isOpen, cities.length]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCities(cities.slice(0, 50)); // Show first 50 cities
    } else {
      const filtered = cities
        .filter((city) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            city.name.toLowerCase().includes(searchLower) ||
            city.country.toLowerCase().includes(searchLower)
          );
        })
        .sort((a, b) => {
          const searchLower = searchTerm.toLowerCase();

          // Prioritize exact matches
          const aNameMatch = a.name.toLowerCase().startsWith(searchLower);
          const bNameMatch = b.name.toLowerCase().startsWith(searchLower);

          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;

          return a.name.localeCompare(b.name);
        })
        .slice(0, 50);

      setFilteredCities(filtered);
    }
    setFocusedIndex(-1); // Reset focus when search changes
  }, [searchTerm, cities]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cities");
      const data = await response.json();
      setCities(data);
      setFilteredCities(data.slice(0, 50));
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const isCitySelected = (city: City) => {
    return selectedCities.some((selected) => selected.id === city.id);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCities.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredCities.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCities.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCities.length) {
          onCitySelect(filteredCities[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && citiesListRef.current) {
      const buttons =
        citiesListRef.current.querySelectorAll(".modal-city-item");
      const focusedButton = buttons[focusedIndex] as HTMLElement;
      if (focusedButton) {
        focusedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedIndex]);

  if (!shouldRender) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: "0",
        background: "#121212",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        opacity: isAnimating ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#121212",
          borderRadius: "0",
          width: "100%",
          maxWidth: "100%",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          transform: isAnimating
            ? "scale(0.95) translateY(20px)"
            : "scale(1) translateY(0)",
          transition: "transform 0.3s ease-out",
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div
          className="modal-content-wrapper flex flex-col h-full"
          style={{
            width: "100%",
            margin: "0 auto",
            alignItems: "center",
          }}
        >
          {/* Header */}
          <div
            className="modal-header flex items-center justify-between"
            style={{
              padding: "24px 24px 24px 24px",
              maxWidth: "560px",
              width: "100%",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateY(-20px)" : "translateY(0)",
              transition:
                "opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s",
            }}
          >
            <h2 className="text-2xl font-medium text-white">Add City</h2>
            <button
              onClick={onClose}
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
              className="modal-close-button transition-colors flex items-center justify-center"
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
              <XMarkIcon
                className="close-icon"
                style={{ width: "20px", height: "20px" }}
              />
            </button>
          </div>

          {/* Search */}
          <div
            className="modal-search border-b"
            style={{
              padding: "0 24px 24px 24px",
              borderBottomColor: "rgba(255, 255, 255, 0.08)",
              maxWidth: "560px",
              width: "100%",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateY(-20px)" : "translateY(0)",
              transition:
                "opacity 0.3s ease-out 0.2s, transform 0.3s ease-out 0.2s",
            }}
          >
            <div className="modal-search-container relative">
              <MagnifyingGlassIcon className="modal-search-icon absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white" />
              <input
                type="text"
                placeholder="Search cities or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modal-search-input w-full pl-10 pr-4 py-3 rounded-lg text-white focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: "#121212",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Cities List */}
          <div
            className="modal-cities-list flex-1 overflow-y-auto flex flex-col items-center"
            style={{
              paddingLeft: "24px",
              paddingRight: "24px",
              width: "100%",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateY(20px)" : "translateY(0)",
              transition:
                "opacity 0.3s ease-out 0.3s, transform 0.3s ease-out 0.3s",
            }}
          >
            {loading ? (
              <div className="modal-loading flex items-center justify-center h-32">
                <div className="modal-loading-text text-gray-400">
                  Loading cities...
                </div>
              </div>
            ) : filteredCities.length === 0 && searchTerm ? (
              <div className="modal-empty-state flex items-center justify-center h-32">
                <div className="modal-empty-text text-gray-400">
                  No cities found
                </div>
              </div>
            ) : (
              <div
                className="modal-cities-container"
                style={{
                  maxWidth: "512px",
                  width: "100%",
                }}
              >
                <div
                  className="modal-cities-grid space-y-1"
                  ref={citiesListRef}
                >
                  {filteredCities.map((city, index) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        if (!isCitySelected(city)) {
                          onCitySelect(city);
                          onClose();
                        }
                      }}
                      disabled={isCitySelected(city)}
                      className="modal-city-item w-full text-left p-4 rounded-lg transition-colors"
                      style={{
                        backgroundColor:
                          index === focusedIndex
                            ? "rgba(255, 255, 255, 0.08)"
                            : isCitySelected(city)
                            ? "rgba(255, 255, 255, 0.04)"
                            : "transparent",
                        color: isCitySelected(city) ? "#666666" : "#ffffff",
                        cursor: isCitySelected(city)
                          ? "not-allowed"
                          : "pointer",
                        border:
                          index === focusedIndex
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCitySelected(city) && index !== focusedIndex) {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.04)";
                        }
                        setFocusedIndex(index);
                      }}
                      onMouseLeave={(e) => {
                        if (!isCitySelected(city) && index !== focusedIndex) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                      onMouseDown={(e) => {
                        if (!isCitySelected(city)) {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.8)";
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!isCitySelected(city) && index !== focusedIndex) {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.04)";
                        } else if (index === focusedIndex) {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.08)";
                        }
                      }}
                    >
                      <div className="modal-city-content flex justify-between items-center">
                        <div className="modal-city-info">
                          <div
                            className="modal-city-name"
                            style={{
                              color: "#FFF",
                              fontFamily: "Manrope",
                              fontSize: "24px",
                              fontStyle: "normal",
                              fontWeight: "400",
                              lineHeight: "normal",
                              letterSpacing: "1px",
                              opacity: isCitySelected(city) ? "0.6" : "1",
                            }}
                          >
                            {city.name}
                          </div>
                          <div
                            className="modal-city-country"
                            style={{
                              color: "#ACACAC",
                              fontFamily: "Fira Mono",
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontWeight: "400",
                              lineHeight: "normal",
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              marginTop: "6px",
                            }}
                          >
                            {(() => {
                              const now = new Date();
                              const timeZone = city.timezone;
                              const formatter = new Intl.DateTimeFormat("en", {
                                timeZone,
                                timeZoneName: "short",
                              });
                              const parts = formatter.formatToParts(now);
                              const timeZoneName =
                                parts.find(
                                  (part) => part.type === "timeZoneName"
                                )?.value || "";

                              // Calculate GMT offset
                              const utc1 = new Date(
                                now.getTime() + now.getTimezoneOffset() * 60000
                              );
                              const utc2 = new Date(
                                utc1.toLocaleString("en-US", { timeZone })
                              );
                              const offset = Math.round(
                                (utc2.getTime() - utc1.getTime()) /
                                  (1000 * 60 * 60)
                              );
                              const offsetStr =
                                offset >= 0 ? `+${offset}` : `${offset}`;

                              return `${city.country} / ${timeZoneName} GMT${offsetStr}`;
                            })()}
                          </div>
                        </div>
                        {isCitySelected(city) && (
                          <div
                            className="modal-city-status"
                            style={{
                              color: "#ACACAC",
                              fontFamily: "Fira Mono",
                              fontSize: "12px",
                              fontStyle: "normal",
                              fontWeight: "400",
                              lineHeight: "normal",
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                            }}
                          >
                            Added
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
