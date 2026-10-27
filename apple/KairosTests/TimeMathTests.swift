import Foundation
import Testing
@testable import Kairos

struct SliderSnappingTests {
    @Test("Forward snap goes to the next quarter hour", arguments: [
        (0, 15), (7, 8), (14, 1), (15, 15), (16, 14), (29, 1), (30, 15), (44, 1), (45, 15), (59, 1),
    ])
    func forwardSnap(minute: Int, expected: Int) {
        #expect(TimeMath.firstQuarterHourOffset(direction: 1, minute: minute) == expected)
    }

    @Test("Backward snap goes to the previous quarter hour", arguments: [
        (0, -15), (7, -7), (15, -15), (16, -1), (30, -15), (31, -1), (44, -14), (45, -15), (46, -1), (59, -14),
    ])
    func backwardSnap(minute: Int, expected: Int) {
        #expect(TimeMath.firstQuarterHourOffset(direction: -1, minute: minute) == expected)
    }

    @Test func stepsToMinutesAtMinute7() {
        // 10:07 → 10:15, 10:30, 10:45 …  and  10:00, 09:45 …
        #expect(TimeMath.minuteOffset(forSteps: 0, minute: 7) == 0)
        #expect(TimeMath.minuteOffset(forSteps: 1, minute: 7) == 8)
        #expect(TimeMath.minuteOffset(forSteps: 2, minute: 7) == 23)
        #expect(TimeMath.minuteOffset(forSteps: 3, minute: 7) == 38)
        #expect(TimeMath.minuteOffset(forSteps: -1, minute: 7) == -7)
        #expect(TimeMath.minuteOffset(forSteps: -2, minute: 7) == -22)
    }

    @Test func everyStepLandsOnAQuarterHour() {
        for minute in 0..<60 {
            for steps in -40...40 where steps != 0 {
                let landing = minute + TimeMath.minuteOffset(forSteps: steps, minute: minute)
                #expect(((landing % 15) + 15) % 15 == 0, "minute \(minute), steps \(steps)")
            }
        }
    }

    @Test func stepsRoundTrip() {
        for minute in 0..<60 {
            for steps in -100...100 {
                let offset = TimeMath.minuteOffset(forSteps: steps, minute: minute)
                #expect(TimeMath.steps(forMinuteOffset: offset, minute: minute) == steps, "minute \(minute), steps \(steps)")
            }
        }
    }

    @Test func dragDirection() {
        // Dragging the ruler left moves into the future.
        #expect(TimeMath.steps(forDragOffset: -16, stepWidth: 8) == 2)
        #expect(TimeMath.steps(forDragOffset: 8, stepWidth: 8) == -1)
        #expect(TimeMath.steps(forDragOffset: 3, stepWidth: 8) == 0)
    }

    @Test func resetSequenceWalksBackOneTickAtATime() {
        // At 10:07, +38 min (10:45) resets via 10:30 and 10:15 to now.
        #expect(TimeMath.resetSequence(from: 38, minute: 7) == [23, 8, 0])
        #expect(TimeMath.resetSequence(from: -22, minute: 7) == [-7, 0])
        #expect(TimeMath.resetSequence(from: 0, minute: 7) == [])
    }

    @Test func resetSequenceMatchesStepCount() {
        for minute in 0..<60 {
            for steps in -30...30 {
                let offset = TimeMath.minuteOffset(forSteps: steps, minute: minute)
                #expect(TimeMath.resetSequence(from: offset, minute: minute).count == abs(steps))
            }
        }
    }

    @Test func resetTiming() {
        #expect(TimeMath.resetStepInterval(stepCount: 4, totalDuration: 0.46) == 0.115)
        #expect(TimeMath.resetStepInterval(stepCount: 1, totalDuration: 0.46) == 0.46)
    }
}

struct LabelTests {
    @Test("Slider label", arguments: [
        (0, "CURRENT TIME"), (8, "+8M"), (45, "+45M"), (60, "+1H"), (75, "+1H 15M"),
        (-7, "-7M"), (-60, "-1H"), (-135, "-2H 15M"),
    ])
    func sliderLabel(offset: Int, expected: String) {
        #expect(TimeMath.sliderLabel(offsetMinutes: offset) == expected)
    }

    @Test func clockString() throws {
        let date = try #require(ISO8601DateFormatter().date(from: "2026-01-15T09:05:00Z"))
        #expect(TimeMath.clockString(for: date, in: try zone("Europe/Istanbul")) == "12:05")
        #expect(TimeMath.clockString(for: date, in: try zone("America/Los_Angeles")) == "01:05")
        #expect(TimeMath.clockString(for: date, in: try zone("Asia/Kolkata")) == "14:35")
    }

    @Test func adjustedDate() throws {
        let now = try #require(ISO8601DateFormatter().date(from: "2026-01-15T09:07:00Z"))
        let shifted = TimeMath.adjustedDate(now: now, offsetMinutes: 38)
        #expect(TimeMath.clockString(for: shifted, in: try zone("UTC")) == "09:45")
    }
}

struct TimeDifferenceTests {
    private let winter = ISO8601DateFormatter().date(from: "2026-01-15T12:00:00Z")!
    private let summer = ISO8601DateFormatter().date(from: "2026-07-15T12:00:00Z")!

    @Test func wholeHourDifferences() throws {
        let istanbul = try zone("Europe/Istanbul")
        #expect(TimeMath.differenceLabel(of: try zone("Asia/Dubai"), from: istanbul, at: winter) == "+1H / GMT+4")
        #expect(TimeMath.differenceLabel(of: try zone("Asia/Tokyo"), from: istanbul, at: winter) == "+6H / GMT+9")
        #expect(TimeMath.differenceLabel(of: try zone("America/Los_Angeles"), from: istanbul, at: winter) == "-11H / PST")
        #expect(TimeMath.differenceLabel(of: try zone("America/Los_Angeles"), from: istanbul, at: summer) == "-10H / PDT")
        #expect(TimeMath.differenceLabel(of: istanbul, from: istanbul, at: winter) == "+0H / GMT+3")
    }

    @Test("Half- and quarter-hour zones keep their minutes", arguments: [
        ("Asia/Kolkata", "+2H 30M"),
        ("Asia/Kathmandu", "+2H 45M"),
        ("America/St_Johns", "-6H 30M"),
    ])
    func fractionalZones(identifier: String, expected: String) throws {
        let diff = TimeMath.differenceMinutes(of: try zone(identifier), from: try zone("Europe/Istanbul"), at: winter)
        #expect(TimeMath.signedDuration(minutes: diff) == expected)
    }

    @Test func differenceFollowsDaylightSavingAtTheShiftedTime() throws {
        // London ↔ New York is 5h most of the year but 4h in the March gap
        // (US switches on 8 Mar 2026, UK on 29 Mar 2026).
        let london = try zone("Europe/London")
        let newYork = try zone("America/New_York")
        let beforeUS = try #require(ISO8601DateFormatter().date(from: "2026-03-07T12:00:00Z"))
        let gap = try #require(ISO8601DateFormatter().date(from: "2026-03-15T12:00:00Z"))
        #expect(TimeMath.differenceMinutes(of: newYork, from: london, at: beforeUS) == -300)
        #expect(TimeMath.differenceMinutes(of: newYork, from: london, at: gap) == -240)
    }

    @Test func gmtOffsetLabels() throws {
        #expect(TimeMath.gmtOffsetLabel(for: try zone("Asia/Kolkata"), at: winter) == "GMT+5:30")
        #expect(TimeMath.gmtOffsetLabel(for: try zone("America/Los_Angeles"), at: winter) == "GMT-8")
        #expect(TimeMath.gmtOffsetLabel(for: try zone("UTC"), at: winter) == "GMT+0")
    }

    @Test func catalogSubtitle() {
        let dubai = City(id: "dubai", name: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai")
        #expect(TimeMath.catalogSubtitle(for: dubai, at: winter) == "United Arab Emirates / GMT+4 GMT+4")
    }
}

func zone(_ identifier: String) throws -> TimeZone {
    try #require(TimeZone(identifier: identifier))
}
