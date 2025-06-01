import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";

export async function GET() {
  try {
    const citiesPath = join(process.cwd(), "server", "data", "cities.json");
    const citiesData = readFileSync(citiesPath, "utf8");
    const citiesObject = JSON.parse(citiesData);

    return NextResponse.json(citiesObject.cities);
  } catch (error) {
    console.error("Error reading cities data:", error);
    return NextResponse.json(
      { error: "Failed to load cities" },
      { status: 500 }
    );
  }
}
