import Foundation

/// Same shape as the web's `City` and the entries in server/data/cities.json,
/// so the saved list stays interchangeable with `localStorage["kairos-selected-cities"]`.
struct City: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let name: String
    let country: String
    let timezone: String

    var timeZone: TimeZone? { TimeZone(identifier: timezone) }
}

extension City {
    /// Id of the device's own city. It is generated per device, always shown first and never saved.
    static let localCityID = "local-user-timezone"

    /// Port of `getUserLocalCity` in app/page.tsx: derives a city from the device time zone,
    /// e.g. "America/New_York" -> "New York", "Americas".
    static func local(timeZoneIdentifier: String = TimeZone.current.identifier) -> City {
        if let override = localOverrides[timeZoneIdentifier] {
            return City(id: localCityID, name: override.city, country: override.country, timezone: timeZoneIdentifier)
        }

        let parts = timeZoneIdentifier.split(separator: "/").map(String.init)
        let cityName = (parts.last ?? "").replacingOccurrences(of: "_", with: " ")
        let region = parts.first ?? ""
        let countryName = regionNames[region] ?? region.replacingOccurrences(of: "_", with: " ")

        return City(
            id: localCityID,
            name: cityName.isEmpty ? "Local Time" : cityName,
            country: countryName.isEmpty ? "Your Location" : countryName,
            timezone: timeZoneIdentifier
        )
    }

    /// Cities shown on first launch, after the local city.
    static let defaults: [City] = [
        City(id: "dubai", name: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai"),
        City(id: "london", name: "London", country: "United Kingdom", timezone: "Europe/London"),
        City(id: "tokyo", name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo"),
        City(id: "los-angeles", name: "Los Angeles", country: "United States", timezone: "America/Los_Angeles"),
        City(id: "sydney", name: "Sydney", country: "Australia", timezone: "Australia/Sydney"),
    ]

    private static let regionNames: [String: String] = [
        "America": "Americas",
        "Europe": "Europe",
        "Asia": "Asia",
        "Africa": "Africa",
        "Australia": "Australia",
        "Pacific": "Pacific",
        "Atlantic": "Atlantic",
        "Indian": "Indian Ocean",
        "Antarctica": "Antarctica",
    ]

    private static let localOverrides: [String: (city: String, country: String)] = [
        "Europe/Istanbul": ("Ankara", "Turkey"),
    ]
}
