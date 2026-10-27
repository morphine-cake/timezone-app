import Foundation
import Testing
@testable import Kairos

struct LocalCityTests {
    @Test("Local city comes from the device time zone", arguments: [
        ("America/New_York", "New York", "Americas"),
        ("Europe/Istanbul", "Ankara", "Turkey"),
        ("Asia/Tokyo", "Tokyo", "Asia"),
        ("America/Argentina/Buenos_Aires", "Buenos Aires", "Americas"),
        ("Indian/Maldives", "Maldives", "Indian Ocean"),
        ("UTC", "UTC", "UTC"),
    ])
    func localCity(identifier: String, name: String, country: String) {
        let city = City.local(timeZoneIdentifier: identifier)
        #expect(city.id == City.localCityID)
        #expect(city.name == name)
        #expect(city.country == country)
        #expect(city.timezone == identifier)
    }

    @Test func defaultsAreValid() {
        #expect(City.defaults.map(\.id) == ["dubai", "london", "tokyo", "los-angeles", "sydney"])
        #expect(City.defaults.allSatisfy { $0.timeZone != nil })
    }

    @Test func encodesLikeTheWebApp() throws {
        let city = City(id: "tokyo", name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo")
        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(city)) as? [String: String]
        #expect(json == ["id": "tokyo", "name": "Tokyo", "country": "Japan", "timezone": "Asia/Tokyo"])
    }
}

struct CityCatalogTests {
    private let catalog: CityCatalog

    init() throws {
        // Tests run hosted in the app, whose bundle holds cities.json.
        catalog = try CityCatalog()
    }

    @Test func loadsSharedCityList() {
        #expect(catalog.cities.count == 383)
        #expect(catalog.cities.first?.id == "new-york")
    }

    @Test func everyTimeZoneIsKnownToFoundation() {
        let unknown = catalog.cities.filter { $0.timeZone == nil }.map(\.timezone)
        #expect(unknown.isEmpty)
    }

    @Test func idsAreUnique() {
        let duplicates = Dictionary(grouping: catalog.cities, by: \.id).filter { $0.value.count > 1 }.keys
        withKnownIssue("server/data/cities.json uses \"san-jose\" for both San Jose, US and San José, Costa Rica") {
            #expect(duplicates.isEmpty)
        }
    }

    @Test func emptySearchShowsFirstFifty() {
        #expect(catalog.search("").count == 50)
        #expect(catalog.search("  ").first?.id == "new-york")
    }

    @Test func prefixMatchesComeFirst() {
        let results = catalog.search("lon")
        #expect(results.first?.name == "London")
        let firstNonPrefix = results.firstIndex { !$0.name.lowercased().hasPrefix("lon") } ?? results.endIndex
        #expect(results[firstNonPrefix...].allSatisfy { !$0.name.lowercased().hasPrefix("lon") })
    }

    @Test func matchesCountryAndIgnoresCaseAndAccents() {
        #expect(catalog.search("JAPAN").contains { $0.name == "Tokyo" })
        #expect(catalog.search("san jose").contains { $0.country == "Costa Rica" })
    }

    @Test func noMatches() {
        #expect(catalog.search("zzzz-not-a-city").isEmpty)
    }
}
