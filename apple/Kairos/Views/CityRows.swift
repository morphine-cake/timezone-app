import SwiftUI

/// Everything a row needs to show times: the current moment, the slider offset and the reference city.
struct ClockContext {
    let now: Date
    let offset: Int
    let reference: City

    var adjustedDate: Date { TimeMath.adjustedDate(now: now, offsetMinutes: offset) }

    func time(for city: City) -> String {
        TimeMath.clockString(for: adjustedDate, in: city.timeZone ?? .current)
    }

    func subtitle(for city: City) -> String {
        if city.id == reference.id { return "YOUR TIME" }
        return TimeMath.differenceLabel(
            of: city.timeZone ?? .current,
            from: reference.timeZone ?? .current,
            at: adjustedDate
        )
    }
}

/// Name + country on the left, animated time + difference on the right.
struct CityRowContent: View {
    let city: City
    let clock: ClockContext
    var showsPin = false
    var infoShift: CGFloat = 0
    var fill: Color = Tokens.Colors.background

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: Tokens.Layout.metaSpacing) {
                Text(city.name)
                    .textStyle(Tokens.Typography.cityName)
                    .foregroundStyle(Tokens.Colors.textPrimary)
                Text(city.country)
                    .textStyle(Tokens.Typography.meta)
                    .foregroundStyle(Tokens.Colors.textSecondary)
            }
            .background(fill)
            .offset(x: infoShift)

            Spacer(minLength: 0)

            VStack(alignment: .trailing, spacing: Tokens.Layout.metaSpacing) {
                AnimatedTimeText(time: clock.time(for: city), offset: clock.offset)
                    .foregroundStyle(Tokens.Colors.textPrimary)
                HStack(spacing: 4) {
                    if showsPin {
                        Icon(name: "icon-map-pin", size: Tokens.Layout.pinIconSize)
                    }
                    Text(clock.subtitle(for: city))
                        .textStyle(Tokens.Typography.meta)
                }
                .foregroundStyle(Tokens.Colors.textSecondary)
            }
        }
        .padding(.vertical, Tokens.Layout.rowVerticalPadding)
        .background(fill)
    }
}

/// The reference (local) city pinned in the header, with the stronger divider.
struct ReferenceRowView: View {
    let city: City
    let clock: ClockContext
    /// Divider edge: below the row when it sits above the list, above it when it sits below.
    var dividerAlignment: Alignment = .bottom

    var body: some View {
        CityRowContent(city: city, clock: clock, showsPin: true)
            .overlay(alignment: dividerAlignment) {
                Rectangle().fill(Tokens.Colors.dividerReference).frame(height: 1)
            }
    }
}

/// A removable row. On Mac, hovering reveals the trash button: it slides in from the left and
/// the name moves 48 pt right. On iPhone rows are removed by swiping; the hidden trash button
/// stays in the hierarchy only as the VoiceOver "Remove" action.
struct CityRowView: View {
    let city: City
    let clock: ClockContext
    let isRevealed: Bool
    /// A row is being picked up and moved somewhere in the list: swiping to delete stands down.
    var isReordering = false
    /// Row background: lighter while the row is picked up.
    var fill: Color = Tokens.Colors.background
    let onDelete: () -> Void

    @State private var isDeleteHovered = false
    @State private var rowWidth: CGFloat = 0
    #if os(iOS)
    @State fileprivate var swipeX: CGFloat = 0
    @State fileprivate var isSwiping = false
    /// Resets by itself when the touch ends or is cancelled; `onEnded` alone misses cancellations.
    @GestureState fileprivate var isSwipeActive = false
    @State fileprivate var isDeleting = false
    fileprivate let swipeDeleteThreshold: CGFloat = 100
    #endif

    var body: some View {
        ZStack(alignment: .leading) {
            CityRowContent(city: city, clock: clock, infoShift: isRevealed ? Tokens.Layout.deleteSlideDistance : 0, fill: fill)

            Button(action: onDelete) {
                Icon(name: "icon-trash")
            }
            .buttonStyle(IconButtonStyle(isHovered: isDeleteHovered, hover: Tokens.Colors.fillPressed, pressed: .white.opacity(0.12)))
            .onHover { isDeleteHovered = $0 }
            .offset(x: isRevealed ? 0 : -Tokens.Layout.iconButtonSize)
            .accessibilityLabel("Remove \(city.name)")
        }
        .animation(Tokens.Motion.deleteReveal, value: isRevealed)
        .clipped()
        #if os(iOS)
        .offset(x: swipeX)
        .opacity(1 - min(abs(swipeX) / max(rowWidth, 1), 1) * 0.6)
        .background {
            // Trash hint on the side the row is being pulled away from.
            if swipeX != 0 {
                Icon(name: "icon-trash")
                    .opacity(min(abs(swipeX) / swipeDeleteThreshold, 1))
                    .frame(maxWidth: .infinity, alignment: swipeX > 0 ? .leading : .trailing)
            }
        }
        .simultaneousGesture(swipeToDelete)
        .sensoryFeedback(.impact(weight: .medium), trigger: abs(swipeX) >= swipeDeleteThreshold) { _, crossed in crossed }
        .onChange(of: isSwipeActive) { _, active in
            // Touch cancelled (scroll view took over, a call, the app switcher): snap back.
            if !active, isSwiping, !isDeleting {
                isSwiping = false
                withAnimation(Tokens.Motion.deleteReveal) { swipeX = 0 }
            }
        }
        #endif
        .overlay(alignment: .bottom) {
            Rectangle().fill(Tokens.Colors.dividerRow).frame(height: 1)
        }
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { rowWidth = $0 }
        .contentShape(Rectangle())
    }
}

#if os(iOS)
extension CityRowView {
    /// Swipe the row left or right past the threshold to remove it. Vertical drags are left to the scroll view.
    fileprivate var swipeToDelete: some Gesture {
        DragGesture(minimumDistance: 20)
            .updating($isSwipeActive) { _, state, _ in state = true }
            .onChanged { value in
                guard !isReordering, !isDeleting else { return }
                if !isSwiping {
                    guard abs(value.translation.width) > abs(value.translation.height) else { return }
                    isSwiping = true
                }
                swipeX = value.translation.width
            }
            .onEnded { value in
                guard isSwiping else { return }
                isSwiping = false
                let travelled = max(abs(value.translation.width), abs(value.predictedEndTranslation.width) * 0.5)
                if travelled >= swipeDeleteThreshold {
                    isDeleting = true
                    let direction: CGFloat = value.translation.width > 0 ? 1 : -1
                    withAnimation(.easeIn(duration: 0.2)) { swipeX = direction * (rowWidth + 40) }
                    Task { @MainActor in
                        try? await Task.sleep(for: .milliseconds(200))
                        onDelete()
                    }
                } else {
                    withAnimation(Tokens.Motion.deleteReveal) { swipeX = 0 }
                }
            }
    }
}
#endif

/// Finger position of the lifted row. Kept out of the list's own state so a frame of dragging
/// redraws only the lifted row, not every row and its animated time.
@Observable
private final class ReorderDrag {
    var offset: CGFloat = 0
    // Read only by the auto-scroll loop and the gesture, never by a body.
    @ObservationIgnored var translation: CGFloat = 0
    /// Finger height on screen; nil until the drag part of the gesture has started.
    @ObservationIgnored var fingerY: CGFloat?
    /// Where auto-scroll has taken the content (absolute offset) and how far since the lift.
    @ObservationIgnored var scrollY: CGFloat = 0
    @ObservationIgnored var scrolled: CGFloat = 0
}

/// The screen's scroll view as the list needs it while a row is dragged: where it is, how far it
/// can go, where it sits on screen, and a way to move it (the user's own scrolling is off then).
@Observable
final class ReorderScroll {
    var position = ScrollPosition()
    @ObservationIgnored var y: CGFloat = 0
    @ObservationIgnored var maxY: CGFloat = 0
    @ObservationIgnored var viewport: CGRect = .zero
}

private struct ReorderShift: ViewModifier {
    let isDragged: Bool
    let shift: CGFloat
    let drag: ReorderDrag

    func body(content: Content) -> some View {
        content.offset(y: isDragged ? drag.offset : shift)
    }
}

/// The list below the header: rows, reveal-to-delete, swipe-to-delete and press-and-drag reordering.
///
/// Reordering works like Reminders: hold a row until it lifts (scale, shadow, haptic), then drag it
/// (on Mac a plain drag is enough). The row follows the finger vertically, the others slide out of
/// the way as it passes their middle, and on release it settles into the gap. The first row (the
/// local city) never moves.
struct CityListView: View {
    let store: CityStore
    let clock: ClockContext
    @Binding var revealedID: String?
    /// True from lift to release, so the screen can stop the scroll view from scrolling under the finger.
    @Binding var isReordering: Bool
    /// Scrolled automatically while a row is held near the top or bottom edge.
    let scroll: ReorderScroll

    /// Measured per row: a long country name can wrap and make a row taller than its neighbours.
    @State private var rowHeights: [String: CGFloat] = [:]
    @State private var draggingID: String?
    /// False once the finger is up: the row is settling into place and no longer looks lifted.
    @State private var isHeld = false
    @State private var isSettling = false
    @State private var startIndex = 0
    @State private var targetIndex = 0
    @State private var drag = ReorderDrag()
    @State private var autoScroll: Task<Void, Never>?
    /// True while the reorder gesture is active. A gesture state resets by itself when the touch
    /// ends *or is cancelled* (a call, the app switcher), which `onEnded` alone doesn't report.
    @GestureState private var isGestureActive = false

    #if os(iOS)
    private static let liftDuration = 0.35
    #endif
    private static let settle = Animation.snappy(duration: 0.25)
    private static let settleMilliseconds = 260
    private static let fallbackRowHeight: CGFloat = 101
    /// Auto-scroll: how close to the viewport edge it starts, and its top speed in points per tick.
    /// The bottom zone is deeper because the list fades out above the slider there.
    private static let topScrollZone: CGFloat = 80
    private static let bottomScrollZone: CGFloat = 120
    private static let maxScrollSpeed: CGFloat = 14

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(store.cities.enumerated()).dropFirst(), id: \.element.id) { index, city in
                let isDragged = draggingID == city.id
                let isLifted = isDragged && isHeld
                CityRowView(
                    city: city,
                    clock: clock,
                    isRevealed: revealedID == city.id && draggingID == nil,
                    isReordering: draggingID != nil,
                    fill: isLifted ? Tokens.Colors.liftedRow : Tokens.Colors.background,
                    onDelete: {
                        revealedID = nil
                        store.remove(id: city.id)
                    }
                )
                .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { rowHeights[city.id] = $0 }
                .appear(.slideInUp, duration: 0.4, delay: Double(index) * Tokens.Motion.rowStagger)
                // iPhone: rows are removed by swiping; the trash button is a Mac hover thing.
                #if os(macOS)
                .onHover { hovering in
                    if hovering { revealedID = city.id } else if revealedID == city.id { revealedID = nil }
                }
                #endif
                // The lifted row is a card that reaches 12 pt past the list margins; the text stays put.
                .padding(.horizontal, isLifted ? 12 : 0)
                .background(isLifted ? Tokens.Colors.liftedRow : .clear)
                .clipShape(RoundedRectangle(cornerRadius: isLifted ? 14 : 0, style: .continuous))
                .padding(.horizontal, isLifted ? -12 : 0)
                .shadow(color: .black.opacity(isLifted ? 0.5 : 0), radius: 18, y: 8)
                .scaleEffect(isLifted ? 1.03 : 1)
                .modifier(ReorderShift(isDragged: isDragged, shift: shift(for: index, id: city.id), drag: drag))
                .zIndex(isDragged ? 1 : 0)
                .gesture(reorderGesture(for: city, at: index))
            }
        }
        // Touch ended or was cancelled: put the row down.
        .onChange(of: isGestureActive) { _, active in
            if !active { drop() }
        }
        // The list changed under a drag (iCloud sync, a delete): the indices no longer mean the
        // same rows, so abandon the drag instead of moving the wrong city.
        .onChange(of: store.cities.map(\.id)) {
            if draggingID != nil, !isSettling { abandon() }
        }
        #if os(iOS)
        .sensoryFeedback(.impact(weight: .medium), trigger: draggingID) { _, new in new != nil }
        .sensoryFeedback(.selection, trigger: targetIndex)
        #endif
    }

    // MARK: Layout

    private func height(at index: Int) -> CGFloat {
        guard store.cities.indices.contains(index) else { return Self.fallbackRowHeight }
        return rowHeights[store.cities[index].id] ?? Self.fallbackRowHeight
    }

    /// Where a row sits while a drag is in progress: the lifted one under the finger, the ones it
    /// has passed one place over (by the lifted row's own height).
    private func shift(for index: Int, id: String) -> CGFloat {
        guard draggingID != nil, id != draggingID else { return 0 }
        let lifted = height(at: startIndex)
        if startIndex < targetIndex, index > startIndex, index <= targetIndex { return -lifted }
        if targetIndex < startIndex, index >= targetIndex, index < startIndex { return lifted }
        return 0
    }

    /// How far the lifted row travels to sit at `target`: the heights of the rows it passes.
    private func distance(from start: Int, to target: Int) -> CGFloat {
        if target > start { return ((start + 1)...target).reduce(0) { $0 + height(at: $1) } }
        if target < start { return -(target..<start).reduce(0) { $0 + height(at: $1) } }
        return 0
    }

    /// The index whose gap the lifted row's middle is over.
    private func targetIndex(for offset: CGFloat) -> Int {
        let last = store.cities.count - 1
        var target = startIndex
        var travelled: CGFloat = 0
        if offset > 0 {
            while target < last, offset > travelled + height(at: target + 1) / 2 {
                travelled += height(at: target + 1)
                target += 1
            }
        } else {
            while target > 1, -offset > travelled + height(at: target - 1) / 2 {
                travelled += height(at: target - 1)
                target -= 1
            }
        }
        return target
    }

    // MARK: Gesture

    #if os(iOS)
    private func reorderGesture(for city: City, at index: Int) -> some Gesture {
        LongPressGesture(minimumDuration: Self.liftDuration)
            .sequenced(before: DragGesture(minimumDistance: 0, coordinateSpace: .global))
            .updating($isGestureActive) { value, state, _ in
                if case .second(true, _) = value { state = true }
            }
            .onChanged { value in
                guard case .second(true, let drag) = value else { return }
                handle(city, at: index, translation: drag?.translation.height ?? 0, fingerY: drag?.location.y)
            }
    }
    #else
    private func reorderGesture(for city: City, at index: Int) -> some Gesture {
        DragGesture(minimumDistance: 4, coordinateSpace: .global)
            .updating($isGestureActive) { _, state, _ in state = true }
            .onChanged { handle(city, at: index, translation: $0.translation.height, fingerY: $0.location.y) }
    }
    #endif

    private func handle(_ city: City, at index: Int, translation: CGFloat, fingerY: CGFloat?) {
        guard !isSettling else { return }
        if draggingID == nil { lift(city, at: index) }
        guard draggingID == city.id else { return }
        drag.translation = translation
        drag.fingerY = fingerY
        followFinger()
    }

    /// The row follows the finger plus however far auto-scroll has moved the content under it.
    private func followFinger() {
        move(to: drag.translation + drag.scrolled)
    }

    // MARK: Auto-scroll

    private func startAutoScroll() {
        drag.scrollY = scroll.y
        drag.scrolled = 0
        autoScroll?.cancel()
        autoScroll = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(16))
                autoScrollTick()
            }
        }
    }

    private func autoScrollTick() {
        guard draggingID != nil, isHeld, let fingerY = drag.fingerY else { return }
        let viewport = scroll.viewport
        let topEdge = viewport.minY + Self.topScrollZone
        let bottomEdge = viewport.maxY - Self.bottomScrollZone
        var speed: CGFloat = 0
        if fingerY < topEdge {
            speed = -Self.maxScrollSpeed * min((topEdge - fingerY) / Self.topScrollZone, 1)
        } else if fingerY > bottomEdge {
            speed = Self.maxScrollSpeed * min((fingerY - bottomEdge) / Self.bottomScrollZone, 1)
        }
        guard speed != 0 else { return }
        let next = min(max(drag.scrollY + speed, 0), scroll.maxY)
        guard next != drag.scrollY else { return }
        drag.scrolled += next - drag.scrollY
        drag.scrollY = next
        scroll.position.scrollTo(y: next)
        followFinger()
    }

    // MARK: Reordering

    private func lift(_ city: City, at index: Int) {
        revealedID = nil
        startIndex = index
        targetIndex = index
        drag.offset = 0
        drag.fingerY = nil
        isReordering = true
        startAutoScroll()
        withAnimation(Self.settle) {
            draggingID = city.id
            isHeld = true
        }
    }

    private func move(to translation: CGFloat) {
        // The row can't leave the movable part of the list.
        let upLimit = -distance(from: startIndex, to: 1)
        let downLimit = distance(from: startIndex, to: store.cities.count - 1)
        drag.offset = min(max(translation, -upLimit), downLimit)
        let target = targetIndex(for: drag.offset)
        if target != targetIndex {
            withAnimation(Self.settle) { targetIndex = target }
        }
    }

    /// Puts the row down in the gap it is over. Safe to call more than once.
    private func drop() {
        guard let id = draggingID, isHeld, !isSettling else { return }
        isSettling = true
        autoScroll?.cancel()
        let to = targetIndex
        withAnimation(Self.settle) {
            drag.offset = distance(from: startIndex, to: to)
            isHeld = false
            isReordering = false
        }
        // Once it has settled the rows are in their final places already, so swapping the data
        // under them is invisible. The row is found by id again in case the list moved meanwhile.
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(Self.settleMilliseconds))
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                if let from = store.cities.firstIndex(where: { $0.id == id }) {
                    store.move(from: from, to: min(max(to, 1), store.cities.count - 1))
                }
                resetDrag()
            }
        }
    }

    /// Ends a drag without moving anything.
    private func abandon() {
        isReordering = false
        resetDrag()
    }

    private func resetDrag() {
        autoScroll?.cancel()
        draggingID = nil
        isHeld = false
        isSettling = false
        startIndex = 0
        targetIndex = 0
        drag.offset = 0
    }
}
