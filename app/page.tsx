"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Plus, X } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

interface UserLocation {
  city: string;
  country: string;
  timezone: string;
}

export default function KairosApp() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Popular cities for quick selection
  const popularCityIds = [
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
  ];

  // Load cities from API
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const citiesData = await response.json();
        setCities(citiesData);
      } catch (error) {
        console.error("Failed to load cities:", error);
      }
    };
    loadCities();
  }, []);

  // Detect user location
  useEffect(() => {
    const detectLocation = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cityName =
        timezone.split("/").pop()?.replace(/_/g, " ") || "Your City";

      setUserLocation({
        city: cityName,
        country: timezone.split("/")[0].replace("_", " "),
        timezone,
      });
    };
    detectLocation();
  }, []);

  // Load saved cities
  useEffect(() => {
    const saved = localStorage.getItem("selectedCities");
    if (saved) {
      setSelectedCities(JSON.parse(saved));
    }
  }, []);

  // Save cities to localStorage
  useEffect(() => {
    if (selectedCities.length > 0) {
      localStorage.setItem("selectedCities", JSON.stringify(selectedCities));
    }
  }, [selectedCities]);

  // Handle custom time changes
  const handleTimeChange = (value: string) => {
    setCustomTime(value);
    const now = DateTime.now();
    const currentTimeString = now.toFormat("HH:mm");
    setIsCustomMode(value !== currentTimeString);
  };

  // Return to current time
  const returnToCurrentTime = () => {
    const now = DateTime.now();
    setCustomTime(now.toFormat("HH:mm"));
    setIsCustomMode(false);
  };

  // Add city
  const addCity = (city: City) => {
    if (!selectedCities.find((c) => c.id === city.id)) {
      setSelectedCities([...selectedCities, city]);
    }
    setIsModalOpen(false);
    setSearchQuery("");
  };

  // Remove city
  const removeCity = (cityId: string) => {
    setSelectedCities(selectedCities.filter((c) => c.id !== cityId));
  };

  // Get time for timezone
  const getTimeForTimezone = (timezone: string) => {
    if (isCustomMode && customTime && userLocation) {
      const [hours, minutes] = customTime.split(":").map(Number);
      const userDateTime = DateTime.now()
        .setZone(userLocation.timezone)
        .set({ hour: hours, minute: minutes });
      return userDateTime.setZone(timezone);
    }
    return DateTime.now().setZone(timezone);
  };

  // Calculate time difference
  const getTimeDifference = (cityTimezone: string) => {
    if (!userLocation) return "";

    const cityTime = DateTime.now().setZone(cityTimezone);
    const userTime = DateTime.now().setZone(userLocation.timezone);
    const diffMinutes = cityTime.offset - userTime.offset;
    const diffHours = Math.floor(Math.abs(diffMinutes) / 60);

    if (diffMinutes === 0) return "Same time";

    const ahead = diffMinutes > 0;
    return `${diffHours}h ${ahead ? "ahead" : "behind"}`;
  };

  // Filter cities for search
  const filteredCities = cities.filter(
    (city) =>
      !selectedCities.find((selected) => selected.id === city.id) &&
      (city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const popularCities = cities.filter(
    (city) =>
      popularCityIds.includes(city.id) &&
      !selectedCities.find((selected) => selected.id === city.id)
  );

  // Initialize custom time with current time
  useEffect(() => {
    if (!customTime) {
      setCustomTime(DateTime.now().toFormat("HH:mm"));
    }
  }, [customTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-left mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Kairos</h1>
          <p className="text-lg text-slate-600">Find the perfect time</p>
        </header>

        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* User Location */}
            {userLocation && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  Your Location
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {userLocation.city}
                </h2>
                <p className="text-slate-600">{userLocation.country}</p>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Add City Button */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add City
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Cities</DialogTitle>
                  </DialogHeader>

                  {/* Search */}
                  <Command className="mb-4">
                    <CommandInput
                      placeholder="Search for a city..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No cities found.</CommandEmpty>
                      {searchQuery && (
                        <CommandGroup heading="Search Results">
                          {filteredCities.slice(0, 8).map((city) => (
                            <CommandItem
                              key={city.id}
                              onSelect={() => addCity(city)}
                              className="cursor-pointer"
                            >
                              <div>
                                <div className="font-medium">{city.name}</div>
                                <div className="text-sm text-slate-500">
                                  {city.country}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>

                  {/* Popular Cities */}
                  {!searchQuery && popularCities.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Popular Cities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {popularCities.slice(0, 12).map((city) => (
                          <Button
                            key={city.id}
                            variant="outline"
                            size="sm"
                            onClick={() => addCity(city)}
                            className="justify-start text-left"
                          >
                            <div>
                              <div className="font-medium">{city.name}</div>
                              <div className="text-xs text-slate-500">
                                {city.country}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Time Input */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-32"
                  />
                </div>
                {isCustomMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={returnToCurrentTime}
                  >
                    Current Time
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* City Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCities.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-8 pb-8 text-center">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No cities selected
                </h3>
                <p className="text-slate-500">
                  Add cities to start tracking their local times
                </p>
              </CardContent>
            </Card>
          ) : (
            selectedCities.map((city) => {
              const cityTime = getTimeForTimezone(city.timezone);
              const timeDiff = getTimeDifference(city.timezone);

              return (
                <Card
                  key={city.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{city.name}</h3>
                        <p className="text-slate-500 text-sm">{city.country}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCity(city.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">
                          {cityTime.toFormat("HH:mm")}
                        </span>
                        {timeDiff && (
                          <Badge variant="secondary" className="text-xs">
                            {timeDiff}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Built with ❤️ for global travelers and remote teams
          </p>
        </footer>
      </div>
    </div>
  );
}
