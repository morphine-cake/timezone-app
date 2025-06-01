import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";

export async function GET() {
  try {
    const citiesPath = join(process.cwd(), "server", "data", "cities.json");
    const citiesData = readFileSync(citiesPath, "utf8");
    const cities = JSON.parse(citiesData);

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error reading cities data:", error);
    return NextResponse.json(
      { error: "Failed to load cities" },
      { status: 500 }
    );
  }
}
