import Foundation
import Testing
@testable import Kairos

@MainActor
struct CityStoreTests {
    private let defaults: UserDefaults
    private let local = City.local(timeZoneIdentifier: "Europe/Istanbul")

    init() {
        let suite = "CityStoreTests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
    }

    private func savedIDs() throws -> [String] {
        let data = try #require(defaults.data(forKey: CityStore.storageKey))
        return try JSONDecoder().decode([City].self, from: data).map(\.id)
    }

    @Test func firstLaunchUsesDefaultsAfterLocalCity() throws {
        let store = CityStore(defaults: defaults, localCity: local)
        #expect(store.cities.map(\.id) == [City.localCityID, "dubai", "london", "tokyo", "los-angeles", "sydney"])
        #expect(try savedIDs() == ["dubai", "london", "tokyo", "los-angeles", "sydney"])
    }

    @Test func savedListIsRestoredAndLocalCityIsNeverSaved() throws {
        let saved = [local, City.defaults[2]]
        defaults.set(try JSONEncoder().encode(saved), forKey: CityStore.storageKey)
        let store = CityStore(defaults: defaults, localCity: local)
        #expect(store.cities.map(\.id) == [City.localCityID, "tokyo"])
    }

    @Test func addIgnoresDuplicates() throws {
        let store = CityStore(defaults: defaults, localCity: local)
        store.add(City.defaults[0])
        store.add(City(id: "paris", name: "Paris", country: "France", timezone: "Europe/Paris"))
        #expect(store.cities.count == 7)
        #expect(try savedIDs().last == "paris")
    }

    @Test func removeKeepsReferenceCity() throws {
        let store = CityStore(defaults: defaults, localCity: local)
        store.remove(id: City.localCityID)
        store.remove(id: "london")
        #expect(store.cities.map(\.id) == [City.localCityID, "dubai", "tokyo", "los-angeles", "sydney"])
        #expect(try savedIDs() == ["dubai", "tokyo", "los-angeles", "sydney"])
    }

    @Test func moveMatchesWebDropRules() {
        let store = CityStore(defaults: defaults, localCity: local)
        // Drag Dubai (1) onto Tokyo (3): lands after it.
        store.move(from: 1, to: 3)
        #expect(store.cities.map(\.id) == [City.localCityID, "london", "tokyo", "dubai", "los-angeles", "sydney"])
        // Drag Sydney (5) onto London (1): lands before it.
        store.move(from: 5, to: 1)
        #expect(store.cities.map(\.id) == [City.localCityID, "sydney", "london", "tokyo", "dubai", "los-angeles"])
        // The reference city can't be moved or dropped on.
        store.move(from: 0, to: 2)
        store.move(from: 2, to: 0)
        #expect(store.cities.first?.id == City.localCityID)
        #expect(store.cities[2].id == "london")
    }
}
