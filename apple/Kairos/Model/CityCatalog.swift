import Foundation

/// The searchable list of cities, loaded from server/data/cities.json (shared with the web app).
struct CityCatalog: Sendable {
    let cities: [City]

    static let resultLimit = 50

    /// The list bundled with the app; empty if it can't be read.
    static let bundled = (try? CityCatalog()) ?? CityCatalog(cities: [])

    init(cities: [City]) {
        self.cities = cities
    }

    init(bundle: Bundle = .main) throws {
        guard let url = bundle.url(forResource: "cities", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        try self.init(data: Data(contentsOf: url))
    }

    init(data: Data) throws {
        struct Payload: Decodable { let cities: [City] }
        self.init(cities: try JSONDecoder().decode(Payload.self, from: data).cities)
    }

    /// The city that best stands for a time zone: the one the zone is named after
    /// ("Asia/Kolkata" -> Kolkata, "America/Bogota" -> Bogotá), else the first listed in it
    /// ("Asia/Ho_Chi_Minh" -> Ho Chi Minh City). Nil when the catalog has no city in the zone.
    func mainCity(inTimeZone identifier: String) -> City? {
        let inZone = cities.filter { $0.timezone == identifier }
        let zoneCity = (identifier.split(separator: "/").last.map(String.init) ?? "")
            .replacingOccurrences(of: "_", with: " ")
        return inZone.first {
            $0.name.compare(zoneCity, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame
        } ?? inZone.first
    }

    /// Port of the filter in CitySelectionModal.tsx: match name or country, names that start
    /// with the query first, then alphabetical, at most 50. Unlike the web it also ignores
    /// accents, so "Sao Paulo" finds "São Paulo".
    func search(_ query: String) -> [City] {
        let term = query.trimmingCharacters(in: .whitespaces)
        guard !term.isEmpty else { return Array(cities.prefix(Self.resultLimit)) }

        let options: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]
        let matches = cities.filter {
            $0.name.range(of: term, options: options) != nil
                || $0.country.range(of: term, options: options) != nil
        }
        let sorted = matches.sorted { a, b in
            let aPrefix = a.name.range(of: term, options: options.union(.anchored)) != nil
            let bPrefix = b.name.range(of: term, options: options.union(.anchored)) != nil
            if aPrefix != bPrefix { return aPrefix }
            return a.name.localizedCompare(b.name) == .orderedAscending
        }
        return Array(sorted.prefix(Self.resultLimit))
    }
}
