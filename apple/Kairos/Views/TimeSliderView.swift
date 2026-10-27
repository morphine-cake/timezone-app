import SwiftUI

/// The ruler you drag to shift time. Port of app/components/TimeSlider.tsx:
/// - drag left = future, drag right = past; the ruler follows the finger, the offset moves
///   in snapped steps (first step to the nearest quarter hour, then 15 min per tick)
/// - on release the ruler settles onto the tick (0.4 s linear)
/// - double tap / double click walks back to "now" one tick at a time in 460 ms
struct TimeSliderView: View {
    @Binding var offset: Int
    /// Current minute of the local clock; decides where the first snap lands.
    let minute: Int

    @State private var rulerOffset: CGFloat = 0
    @State private var dragStartRuler: CGFloat?
    @State private var isResetting = false
    @State private var resetTask: Task<Void, Never>?
    @State private var lastTap: Date?

    private typealias S = Tokens.Slider
    private let border: CGFloat = 1

    /// Total height: the needle overhang above, the border, the ruler and the margin below.
    static let height = S.topPadding + 1 + S.rulerHeight + S.bottomMargin

    private var isDragging: Bool { dragStartRuler != nil }
    private var rulerTop: CGFloat { S.topPadding + border }

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let center = width / 2

            ZStack(alignment: .topLeading) {
                // Ruler area (overflow hidden on the web)
                ZStack(alignment: .topLeading) {
                    rangeRectangle(center: center)
                    ticks(width: width)
                }
                .frame(width: width, height: S.rulerHeight, alignment: .topLeading)
                .clipped()
                .offset(y: rulerTop)

                // Top border of the slider
                Rectangle()
                    .fill(Tokens.Colors.dividerSlider)
                    .frame(width: width, height: border)
                    .offset(y: S.topPadding)

                // Fixed orange needle
                Rectangle()
                    .fill(Tokens.Colors.accent)
                    .frame(width: S.needleWidth, height: S.needleHeight)
                    .offset(x: center - S.needleWidth / 2, y: rulerTop - S.needleOverhang)

                Text(TimeMath.sliderLabel(offsetMinutes: offset))
                    .textStyle(Tokens.Typography.meta)
                    .foregroundStyle(Tokens.Colors.accent)
                    .fixedSize()
                    .offset(x: center + S.labelOffset, y: rulerTop - S.needleOverhang)

                // Triangle under the ruler marking "now"; moves with the ruler
                Triangle()
                    .fill(Tokens.Colors.accent)
                    .frame(width: S.triangleSize.width, height: S.triangleSize.height)
                    .offset(
                        x: center - S.triangleSize.width / 2 + rulerOffset,
                        y: rulerTop + S.rulerHeight + S.triangleOffset - S.triangleSize.height
                    )

                // Edge fades, above everything
                fade(.leading)
                    .offset(y: rulerTop)
                fade(.trailing)
                    .offset(x: width - S.fadeWidth, y: rulerTop)
            }
            .frame(width: width, height: Self.height, alignment: .topLeading)
            .clipped()
            .contentShape(Rectangle())
            .gesture(dragGesture)
        }
        .frame(height: Self.height)
        .onAppear { rulerOffset = targetRuler }
        .onChange(of: offset) { syncRulerToOffset() }
        .onChange(of: minute) { syncRulerToOffset() }
        #if os(iOS)
        .sensoryFeedback(.selection, trigger: offset)
        #endif
        #if os(macOS)
        .pointerStyle(isDragging ? .grabActive : .grabIdle)
        #endif
        .accessibilityElement()
        .accessibilityLabel("Time offset")
        .accessibilityValue(TimeMath.sliderLabel(offsetMinutes: offset))
        .accessibilityAdjustableAction { direction in
            let steps = TimeMath.steps(forMinuteOffset: offset, minute: minute) + (direction == .increment ? 1 : -1)
            offset = TimeMath.minuteOffset(forSteps: steps, minute: minute)
        }
    }

    // MARK: - Parts

    private func ticks(width: CGFloat) -> some View {
        // Canvas spans three widths and is moved with .offset so ruler motion animates;
        // ticks sit at i * 8 from the left edge, like the web.
        let r = rulerOffset
        return Canvas { context, size in
            let first = Int(((-width - r) / S.stepWidth).rounded(.down)) - 1
            let last = Int(((2 * width - r) / S.stepWidth).rounded(.up)) + 1
            for i in first...last {
                let isMajor = i.mod(6) == 0
                let isMedium = !isMajor && i.mod(3) == 0
                let height = isMajor ? S.tickHeightMajor : isMedium ? S.tickHeightMedium : S.tickHeightRegular
                let opacity = isMajor ? S.tickOpacityMajor : isMedium ? S.tickOpacityMedium : S.tickOpacityRegular
                let x = CGFloat(i) * S.stepWidth + width
                context.fill(
                    Path(CGRect(x: x, y: size.height - height, width: S.tickWidth, height: height)),
                    with: .color(.white.opacity(opacity))
                )
            }
        }
        .frame(width: width * 3, height: S.rulerHeight)
        .offset(x: -width + rulerOffset)
    }

    @ViewBuilder
    private func rangeRectangle(center: CGFloat) -> some View {
        if offset != 0 {
            Rectangle()
                .fill(Tokens.Colors.fillHover)
                .frame(width: abs(rulerOffset), height: S.rulerHeight)
                .offset(x: offset > 0 ? center + rulerOffset : center)
        }
    }

    private func fade(_ edge: HorizontalEdge) -> some View {
        LinearGradient(
            colors: [Tokens.Colors.background, Tokens.Colors.background.opacity(0)],
            startPoint: edge == .leading ? .leading : .trailing,
            endPoint: edge == .leading ? .trailing : .leading
        )
        .frame(width: S.fadeWidth, height: S.rulerHeight + 20)
        .allowsHitTesting(false)
    }

    // MARK: - Interaction

    private var targetRuler: CGFloat {
        -CGFloat(TimeMath.steps(forMinuteOffset: offset, minute: minute)) * S.stepWidth
    }

    private func syncRulerToOffset() {
        guard !isDragging else { return }
        if isResetting {
            rulerOffset = targetRuler
        } else {
            withAnimation(Tokens.Motion.rulerSettle) { rulerOffset = targetRuler }
        }
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                if dragStartRuler == nil {
                    resetTask?.cancel()
                    isResetting = false
                    dragStartRuler = rulerOffset
                }
                let ruler = (dragStartRuler ?? 0) + value.translation.width
                rulerOffset = ruler
                let steps = TimeMath.steps(forDragOffset: ruler, stepWidth: S.stepWidth)
                let newOffset = TimeMath.minuteOffset(forSteps: steps, minute: minute)
                if newOffset != offset { offset = newOffset }
            }
            .onEnded { value in
                dragStartRuler = nil
                if abs(value.translation.width) < 4, abs(value.translation.height) < 4 {
                    handleTap()
                }
                withAnimation(Tokens.Motion.rulerSettle) { rulerOffset = targetRuler }
            }
    }

    private func handleTap() {
        let now = Date()
        if let lastTap, now.timeIntervalSince(lastTap) < S.doubleTapInterval {
            self.lastTap = nil
            resetToNow()
        } else {
            lastTap = now
        }
    }

    private func resetToNow() {
        let sequence = TimeMath.resetSequence(from: offset, minute: minute)
        guard !sequence.isEmpty else { return }
        let interval = TimeMath.resetStepInterval(stepCount: sequence.count, totalDuration: Tokens.Motion.resetToNowDuration)

        resetTask?.cancel()
        isResetting = true
        resetTask = Task { @MainActor in
            for (index, value) in sequence.enumerated() {
                if index > 0 {
                    try? await Task.sleep(for: .seconds(interval))
                }
                if Task.isCancelled { return }
                offset = value
            }
            isResetting = false
        }
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        Path { p in
            p.move(to: CGPoint(x: rect.midX, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            p.closeSubpath()
        }
    }
}

private extension Int {
    func mod(_ n: Int) -> Int { ((self % n) + n) % n }
}
