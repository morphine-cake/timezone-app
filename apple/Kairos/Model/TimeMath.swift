import Foundation
import Synchronization

/// Time calculations behind the slider and the city rows, ported from
/// app/components/TimeSlider.tsx and app/page.tsx.
///
/// Offsets are whole minutes relative to "now". Positive = future (drag left),
/// negative = past (drag right). `minute` is the current minute of the local clock,
/// which decides where the first quarter-hour snap lands.
enum TimeMath {
    // MARK: - Slider snapping

    /// Minutes to the next (direction > 0) or previous (direction < 0) quarter hour.
    /// Exact port of `getFirstQuarterHourOffset`.
    static func firstQuarterHourOffset(direction: Int, minute: Int) -> Int {
        if direction > 0 {
            if minute == 0 { return 15 }
            if minute < 15 { return 15 - minute }
            if minute < 30 { return 30 - minute }
            if minute < 45 { return 45 - minute }
            return 60 - minute
        } else {
            if minute == 0 { return -15 }
            if minute <= 15 { return -minute }
            if minute <= 30 { return -(minute - 15) }
            if minute <= 45 { return -(minute - 30) }
            return -(minute - 45)
        }
    }

    /// Minute offset for a number of slider ticks: the first tick snaps to a quarter hour,
    /// each further tick adds 15 minutes.
    static func minuteOffset(forSteps steps: Int, minute: Int) -> Int {
        if steps == 0 { return 0 }
        let first = firstQuarterHourOffset(direction: steps, minute: minute)
        if abs(steps) == 1 { return first }
        return first + (steps > 0 ? (steps - 1) * 15 : (steps + 1) * 15)
    }

    /// Inverse of `minuteOffset(forSteps:minute:)`: how many ticks the ruler is moved.
    static func steps(forMinuteOffset offset: Int, minute: Int) -> Int {
        if offset == 0 { return 0 }
        let sign = offset > 0 ? 1 : -1
        let first = firstQuarterHourOffset(direction: sign, minute: minute)
        if abs(offset) <= abs(first) { return sign }
        return sign + Int((Double(offset - first) / 15).rounded())
    }

    /// Ruler steps for a horizontal drag. Dragging left (negative x) moves into the future.
    static func steps(forDragOffset x: Double, stepWidth: Double) -> Int {
        let steps = -Int((x / stepWidth).rounded())
        return steps == 0 ? 0 : steps // avoid -0
    }

    /// One step of the double-tap "back to now" animation.
    static func nextOffsetTowardNow(from offset: Int, minute: Int) -> Int {
        if offset == 0 { return 0 }
        let first = firstQuarterHourOffset(direction: offset > 0 ? 1 : -1, minute: minute)
        if abs(offset) <= abs(first) { return 0 }
        return offset > 0 ? offset - 15 : offset + 15
    }

    /// Every offset the "back to now" animation passes through, ending with 0.
    static func resetSequence(from offset: Int, minute: Int) -> [Int] {
        var sequence: [Int] = []
        var current = offset
        while current != 0 {
            current = nextOffsetTowardNow(from: current, minute: minute)
            sequence.append(current)
        }
        return sequence
    }

    /// Delay between reset steps so the whole animation takes `totalDuration` (460 ms on the web).
    static func resetStepInterval(stepCount: Int, totalDuration: TimeInterval) -> TimeInterval {
        stepCount > 1 ? totalDuration / Double(stepCount) : totalDuration
    }

    // MARK: - Labels

    /// Orange label next to the slider needle: "CURRENT TIME", "+45M", "+1H 15M", "-2H".
    /// The web drops the minus sign for past offsets of an hour or more; this does not.
    static func sliderLabel(offsetMinutes: Int) -> String {
        offsetMinutes == 0 ? "CURRENT TIME" : signedDuration(minutes: offsetMinutes)
    }

    /// "+2H", "-45M", "+5H 30M". Zero is "+0H".
    static func signedDuration(minutes: Int) -> String {
        let sign = minutes < 0 ? "-" : "+"
        let hours = abs(minutes) / 60
        let mins = abs(minutes) % 60
        switch (hours, mins) {
        case (_, 0): return "\(sign)\(hours)H"
        case (0, _): return "\(sign)\(mins)M"
        default: return "\(sign)\(hours)H \(mins)M"
        }
    }

    /// "HH:mm" for a moment in a time zone.
    static func clockString(for date: Date, in timeZone: TimeZone) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", parts.hour ?? 0, parts.minute ?? 0)
    }

    /// The moment shown in the rows: now shifted by the slider offset.
    static func adjustedDate(now: Date, offsetMinutes: Int) -> Date {
        now.addingTimeInterval(TimeInterval(offsetMinutes * 60))
    }

    /// Difference between a city and the reference city, in minutes, at a given moment.
    /// The web rounds to whole hours and always uses "now"; this keeps half-hour zones
    /// and uses the shifted moment so daylight-saving changes are reflected.
    static func differenceMinutes(of timeZone: TimeZone, from reference: TimeZone, at date: Date) -> Int {
        (timeZone.secondsFromGMT(for: date) - reference.secondsFromGMT(for: date)) / 60
    }

    /// Row subtitle for a non-reference city: "+3H / GMT+4", "-9H / PDT", "+2H 30M / GMT+5:30".
    static func differenceLabel(of timeZone: TimeZone, from reference: TimeZone, at date: Date) -> String {
        let diff = differenceMinutes(of: timeZone, from: reference, at: date)
        return "\(signedDuration(minutes: diff)) / \(abbreviation(for: timeZone, at: date))"
    }

    /// Short zone name as the web shows it (Luxon "ZZZZ" / Intl en-US): "PDT", "GMT+4", "GMT+5:30".
    /// Called for every row each second, so one formatter per zone is kept rather than made each time.
    static func abbreviation(for timeZone: TimeZone, at date: Date) -> String {
        abbreviationFormatters.withLock { formatters in
            let formatter = formatters[timeZone.identifier] ?? {
                let formatter = DateFormatter()
                formatter.locale = Locale(identifier: "en_US")
                formatter.timeZone = timeZone
                formatter.dateFormat = "zzz"
                formatters[timeZone.identifier] = formatter
                return formatter
            }()
            return formatter.string(from: date)
        }
    }

    private static let abbreviationFormatters = Mutex<[String: DateFormatter]>([:])

    /// "GMT+4", "GMT-8", "GMT+5:30", "GMT+0".
    static func gmtOffsetLabel(for timeZone: TimeZone, at date: Date) -> String {
        let minutes = timeZone.secondsFromGMT(for: date) / 60
        let sign = minutes < 0 ? "-" : "+"
        let hours = abs(minutes) / 60
        let mins = abs(minutes) % 60
        return mins == 0 ? "GMT\(sign)\(hours)" : String(format: "GMT%@%d:%02d", sign, hours, mins)
    }

    /// Subtitle in the Add City list: "INDIA / GMT+5:30 GMT+5:30" (upper-cased by the text style).
    static func catalogSubtitle(for city: City, at date: Date) -> String {
        guard let timeZone = city.timeZone else { return city.country }
        return "\(city.country) / \(abbreviation(for: timeZone, at: date)) \(gmtOffsetLabel(for: timeZone, at: date))"
    }
}
