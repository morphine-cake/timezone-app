import Foundation
import Observation
import SwiftUI

/// The parts of `NSUbiquitousKeyValueStore` the store uses, so tests can swap in a fake.
protocol CloudKeyValueStore: AnyObject {
    func data(forKey key: String) -> Data?
    func set(_ data: Data?, forKey key: String)
    @discardableResult func synchronize() -> Bool
}

extension NSUbiquitousKeyValueStore: CloudKeyValueStore {}

/// The user's ordered city list. The first entry is always the device's local city,
/// which is generated per device and never saved (same rules as app/page.tsx).
///
/// The list is synced between the user's devices with iCloud key-value storage, under the
/// web's localStorage key and JSON shape, and mirrored to `UserDefaults` so the app also
/// works when iCloud is signed out.
@MainActor
@Observable
final class CityStore {
    /// Same key as the web's localStorage entry.
    static let storageKey = "kairos-selected-cities"

    private(set) var cities: [City]
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let cloud: CloudKeyValueStore
    @ObservationIgnored nonisolated(unsafe) private var observer: (any NSObjectProtocol)?

    init(
        defaults: UserDefaults = .standard,
        cloud: CloudKeyValueStore = NSUbiquitousKeyValueStore.default,
        localCity: City = .local()
    ) {
        self.defaults = defaults
        self.cloud = cloud
        cloud.synchronize()

        let saved = Self.decode(cloud.data(forKey: Self.storageKey)) ?? Self.decode(defaults.data(forKey: Self.storageKey))
        cities = [localCity] + (saved ?? City.defaults)
        // Only the local mirror is written here: until the user changes the list, iCloud keeps
        // whatever another device stored (writes before the first iCloud download are dropped anyway).
        saveLocally()

        observer = NotificationCenter.default.addObserver(
            forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: cloud,
            queue: .main
        ) { [weak self] notification in
            let reason = notification.userInfo?[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int
            let keys = notification.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String]
            MainActor.assumeIsolated {
                self?.cloudDidChange(reason: reason, keys: keys)
            }
        }
    }

    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
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

    // MARK: iCloud

    /// Another device changed the list (or iCloud finished its first download, or the
    /// account changed): take the iCloud copy, keeping this device's local city first.
    func cloudDidChange(reason: Int?, keys: [String]?) {
        guard reason != NSUbiquitousKeyValueStoreQuotaViolationChange,
              keys?.contains(Self.storageKey) ?? true,
              let synced = Self.decode(cloud.data(forKey: Self.storageKey)) else { return }
        let updated = [cities[0]] + synced
        guard updated != cities else { return }
        withAnimation(Tokens.Motion.reorder) {
            cities = updated
        }
        saveLocally()
    }

    // MARK: Persistence

    private var encodedList: Data? {
        try? JSONEncoder().encode(cities.filter { $0.id != City.localCityID })
    }

    private func save() {
        guard let data = encodedList else { return }
        defaults.set(data, forKey: Self.storageKey)
        cloud.set(data, forKey: Self.storageKey)
        cloud.synchronize()
    }

    private func saveLocally() {
        guard let data = encodedList else { return }
        defaults.set(data, forKey: Self.storageKey)
    }

    /// Saved lists never contain the local city; older web data might, so it is dropped.
    private static func decode(_ data: Data?) -> [City]? {
        guard let data, let cities = try? JSONDecoder().decode([City].self, from: data) else { return nil }
        let saved = cities.filter { $0.id != City.localCityID }
        return saved.isEmpty ? nil : saved
    }
}
