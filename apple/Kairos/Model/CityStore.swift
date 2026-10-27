import Foundation
import Observation

/// The user's ordered city list. The first entry is always the device's local city,
/// which is generated per device and never saved (same rules as app/page.tsx).
@MainActor
@Observable
final class CityStore {
    /// Same key as the web's localStorage entry.
    static let storageKey = "kairos-selected-cities"

    private(set) var cities: [City]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard, localCity: City = .local()) {
        self.defaults = defaults
        let saved = Self.decode(defaults.data(forKey: Self.storageKey))
        let rest = saved.map { $0.filter { $0.id != City.localCityID } } ?? City.defaults
        cities = [localCity] + rest
        if saved == nil { save() }
    }

    var reference: City { cities[0] }

    func contains(_ city: City) -> Bool {
        cities.contains { $0.id == city.id }
    }

    func add(_ city: City) {
        guard !contains(city) else { return }
        cities.append(city)
        save()
    }

    func remove(id: String) {
        guard id != City.localCityID else { return }
        cities.removeAll { $0.id == id }
        save()
    }

    /// Port of `handleDrop`: take the dragged city out and insert it at `dropIndex`.
    /// The reference city (index 0) can neither move nor be dropped on.
    func move(from draggedIndex: Int, to dropIndex: Int) {
        guard draggedIndex != dropIndex, draggedIndex > 0, dropIndex > 0,
              cities.indices.contains(draggedIndex), cities.indices.contains(dropIndex) else { return }
        let city = cities.remove(at: draggedIndex)
        cities.insert(city, at: dropIndex)
        save()
    }

    private func save() {
        let toSave = cities.filter { $0.id != City.localCityID }
        if let data = try? JSONEncoder().encode(toSave) {
            defaults.set(data, forKey: Self.storageKey)
        }
    }

    private static func decode(_ data: Data?) -> [City]? {
        guard let data, let cities = try? JSONDecoder().decode([City].self, from: data), !cities.isEmpty else {
            return nil
        }
        return cities
    }
}
