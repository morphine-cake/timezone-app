import Foundation
import Testing
@testable import Kairos

@MainActor
struct CityStoreTests {
    private let defaults: UserDefaults
    private let cloud = FakeCloud()
    private let local = City.local(timeZoneIdentifier: "Europe/Istanbul")

    init() {
        let suite = "CityStoreTests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
    }

    private func makeStore() -> CityStore {
        CityStore(defaults: defaults, cloud: cloud, localCity: local)
    }

    private func savedIDs() throws -> [String] {
        let data = try #require(defaults.data(forKey: CityStore.storageKey))
        return try JSONDecoder().decode([City].self, from: data).map(\.id)
    }

    private func cloudIDs() throws -> [String] {
        let data = try #require(cloud.values[CityStore.storageKey])
        return try JSONDecoder().decode([City].self, from: data).map(\.id)
    }

    private func encoded(_ ids: [String]) throws -> Data {
        try JSONEncoder().encode(ids.map { id in City.defaults.first { $0.id == id }! })
    }

    @Test func firstLaunchUsesDefaultsAfterLocalCity() throws {
        let store = makeStore()
        #expect(store.cities.map(\.id) == [City.localCityID, "dubai", "london", "tokyo", "los-angeles", "sydney"])
        #expect(try savedIDs() == ["dubai", "london", "tokyo", "los-angeles", "sydney"])
    }

    @Test func savedListIsRestoredAndLocalCityIsNeverSaved() throws {
        let saved = [local, City.defaults[2]]
        defaults.set(try JSONEncoder().encode(saved), forKey: CityStore.storageKey)
        let store = makeStore()
        #expect(store.cities.map(\.id) == [City.localCityID, "tokyo"])
    }

    @Test func addIgnoresDuplicates() throws {
        let store = makeStore()
        store.add(City.defaults[0])
        store.add(City(id: "paris", name: "Paris", country: "France", timezone: "Europe/Paris"))
        #expect(store.cities.count == 7)
        #expect(try savedIDs().last == "paris")
    }

    @Test func removeKeepsReferenceCity() throws {
        let store = makeStore()
        store.remove(id: City.localCityID)
        store.remove(id: "london")
        #expect(store.cities.map(\.id) == [City.localCityID, "dubai", "tokyo", "los-angeles", "sydney"])
        #expect(try savedIDs() == ["dubai", "tokyo", "los-angeles", "sydney"])
    }

    @Test func moveMatchesWebDropRules() {
        let store = makeStore()
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

    // MARK: iCloud

    @Test func iCloudListWinsOverLocalMirrorAtLaunch() throws {
        defaults.set(try encoded(["dubai"]), forKey: CityStore.storageKey)
        cloud.values[CityStore.storageKey] = try encoded(["tokyo", "london"])
        let store = makeStore()
        #expect(store.cities.map(\.id) == [City.localCityID, "tokyo", "london"])
        #expect(try savedIDs() == ["tokyo", "london"])
    }

    @Test func launchDoesNotOverwriteICloud() {
        _ = makeStore()
        #expect(cloud.values[CityStore.storageKey] == nil)
        #expect(cloud.synchronizeCount == 1)
    }

    @Test func changesAreWrittenToICloud() throws {
        let store = makeStore()
        store.remove(id: "dubai")
        store.move(from: 1, to: 2)
        #expect(try cloudIDs() == ["tokyo", "london", "los-angeles", "sydney"])
        #expect(try savedIDs() == ["tokyo", "london", "los-angeles", "sydney"])
        #expect(cloud.synchronizeCount == 3)
    }

    @Test func externalChangeReplacesListAndKeepsLocalCity() throws {
        let store = makeStore()
        cloud.values[CityStore.storageKey] = try encoded(["sydney", "dubai"])
        NotificationCenter.default.post(
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: cloud,
            userInfo: [
                NSUbiquitousKeyValueStoreChangeReasonKey: NSUbiquitousKeyValueStoreServerChange,
                NSUbiquitousKeyValueStoreChangedKeysKey: [CityStore.storageKey],
            ]
        )
        #expect(store.cities.map(\.id) == [City.localCityID, "sydney", "dubai"])
        #expect(try savedIDs() == ["sydney", "dubai"])
    }

    @Test func externalChangeIgnoresOtherKeysAndQuotaErrors() throws {
        let store = makeStore()
        cloud.values[CityStore.storageKey] = try encoded(["sydney"])
        store.cloudDidChange(reason: NSUbiquitousKeyValueStoreServerChange, keys: ["something-else"])
        store.cloudDidChange(reason: NSUbiquitousKeyValueStoreQuotaViolationChange, keys: [CityStore.storageKey])
        #expect(store.cities.count == 6)
        store.cloudDidChange(reason: NSUbiquitousKeyValueStoreAccountChange, keys: nil)
        #expect(store.cities.map(\.id) == [City.localCityID, "sydney"])
    }
}

private final class FakeCloud: CloudKeyValueStore {
    var values: [String: Data] = [:]
    var synchronizeCount = 0

    func data(forKey key: String) -> Data? { values[key] }
    func set(_ data: Data?, forKey key: String) { values[key] = data }
    func synchronize() -> Bool {
        synchronizeCount += 1
        return true
    }
}
