const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Load cities data
const getCitiesData = () => {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "data/cities.json"),
      "utf8"
    );
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading cities data:", error);
    return { cities: [] };
  }
};

// API Routes

// GET /api/cities - Returns list of cities with their timezone identifiers
app.get("/api/cities", (req, res) => {
  try {
    const citiesData = getCitiesData();
    res.json(citiesData.cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities data" });
  }
});

// GET /api/time?timezone=America/New_York - Returns current time for specified timezone
app.get("/api/time", (req, res) => {
  const { timezone } = req.query;

  if (!timezone) {
    return res.status(400).json({ error: "Timezone parameter is required" });
  }

  try {
    // Validate timezone using Intl API
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const now = new Date();
    const formattedTime = formatter.format(now);

    // Get timezone offset
    const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetDate = new Date(
      utcDate.toLocaleString("en-US", { timeZone: timezone })
    );
    const offsetMinutes = Math.round(
      (targetDate.getTime() - utcDate.getTime()) / 60000
    );
    const offsetHours = offsetMinutes / 60;

    res.json({
      timezone,
      currentTime: formattedTime,
      timestamp: now.getTime(),
      offsetHours,
      offsetMinutes,
    });
  } catch (error) {
    console.error("Error getting time for timezone:", timezone, error);
    res.status(400).json({ error: `Invalid timezone: ${timezone}` });
  }
});

// Serve the main HTML file for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`⏰ Kairos server running on http://localhost:${PORT}`);
});
