import SwiftUI

/// "HH:mm" where each changed digit rolls in when the slider moves.
/// Port of app/components/AnimatedTimeDisplay.tsx: digits come from the top when moving
/// into the future and from the bottom when moving into the past; the clock passing a
/// minute updates without animation.
struct AnimatedTimeText: View {
    let time: String
    let offset: Int
    var style = Tokens.Typography.time

    @State private var digits: [String]
    @State private var tokens = Array(repeating: 0, count: 5)
    @State private var fromTop = true

    init(time: String, offset: Int, style: TextStyle = Tokens.Typography.time) {
        self.time = time
        self.offset = offset
        self.style = style
        _digits = State(initialValue: time.map(String.init))
    }

    private struct Key: Equatable {
        let time: String
        let offset: Int
    }

    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<digits.count, id: \.self) { index in
                DigitSlot(
                    digit: digits[index],
                    token: tokens[index],
                    fromTop: fromTop,
                    minWidth: style.size * (digits[index] == ":" ? 0.3 : 0.6),
                    style: style
                )
            }
        }
        .onChange(of: Key(time: time, offset: offset)) { old, new in
            let newDigits = new.time.map(String.init)
            if old.offset != new.offset, newDigits.count == digits.count {
                fromTop = new.offset > old.offset
                for index in digits.indices where digits[index] != ":" && digits[index] != newDigits[index] {
                    tokens[index] += 1
                }
            }
            digits = newDigits
        }
    }
}

private struct DigitSlot: View {
    let digit: String
    let token: Int
    let fromTop: Bool
    let minWidth: CGFloat
    let style: TextStyle

    private struct Phase {
        var opacity = 1.0
        var y = 0.0
    }

    var body: some View {
        let height = height
        return Text(digit)
            .textStyle(style)
            .frame(minWidth: minWidth)
            .keyframeAnimator(initialValue: Phase(), trigger: token) { content, phase in
                content
                    .opacity(phase.opacity)
                    .offset(y: phase.y * height)
            } keyframes: { _ in
                // CSS slideInFromTop/Bottom: 0% hidden at ∓100%, 50% half visible at ∓20%, 100% in place.
                // The web swaps the digit 50 ms after the change, so the slot is empty for that long.
                let start: Double = fromTop ? -1 : 1
                let curve = UnitCurve.bezier(startControlPoint: UnitPoint(x: 0.4, y: 0), endControlPoint: UnitPoint(x: 0.2, y: 1))
                KeyframeTrack(\.opacity) {
                    MoveKeyframe(0)
                    LinearKeyframe(0, duration: 0.05)
                    LinearKeyframe(0.5, duration: 0.15, timingCurve: curve)
                    LinearKeyframe(1, duration: 0.15, timingCurve: curve)
                }
                KeyframeTrack(\.y) {
                    MoveKeyframe(start)
                    LinearKeyframe(start, duration: 0.05)
                    LinearKeyframe(start * 0.2, duration: 0.15, timingCurve: curve)
                    LinearKeyframe(0, duration: 0.15, timingCurve: curve)
                }
            }
            .frame(height: height)
            .clipped()
    }

    private var height: CGFloat { style.lineHeight ?? style.size * 1.2 }
}
