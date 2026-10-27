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
            .background(Tokens.Colors.background)
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
        .background(Tokens.Colors.background)
    }
}

/// The reference (local) city pinned in the header, with the stronger divider.
struct ReferenceRowView: View {
    let city: City
    let clock: ClockContext

    var body: some View {
        CityRowContent(city: city, clock: clock, showsPin: true)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Tokens.Colors.dividerReference).frame(height: 1)
            }
    }
}

/// A removable, draggable city row. When revealed (hover on Mac, tap on iPhone — the same
/// thing a tap does on the mobile web) the trash button slides in from the left and the
/// name moves 48 pt right.
struct CityRowView: View {
    let city: City
    let clock: ClockContext
    let isRevealed: Bool
    let isDragging: Bool
    let isDraggedOver: Bool
    let onDelete: () -> Void

    @State private var isDeleteHovered = false

    var body: some View {
        ZStack(alignment: .leading) {
            CityRowContent(city: city, clock: clock, infoShift: isRevealed ? Tokens.Layout.deleteSlideDistance : 0)

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
        .overlay(alignment: .bottom) {
            Rectangle().fill(Tokens.Colors.dividerRow).frame(height: 1)
        }
        .background(isDraggedOver ? Tokens.Colors.fillHover : .clear)
        .scaleEffect(isDraggedOver ? 1.02 : 1)
        .opacity(isDragging ? 0.5 : 1)
        .animation(Tokens.Motion.reorder, value: isDraggedOver)
        .animation(Tokens.Motion.reorder, value: isDragging)
        .contentShape(Rectangle())
    }
}

/// 2 pt orange line showing where a dragged city will land.
struct DropLine: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 1)
            .fill(Tokens.Colors.accent)
            .frame(height: 2)
            .padding(.vertical, 4)
    }
}

/// The list below the header: rows, reveal-to-delete and drag-to-reorder.
/// Reordering uses system drag and drop, the same model as the web's HTML5
/// dragstart / dragover / drop handlers in app/page.tsx: long-press to lift on iPhone,
/// plain mouse drag on Mac, and the list keeps scrolling normally.
struct CityListView: View {
    let store: CityStore
    let clock: ClockContext
    @Binding var revealedID: String?

    @State private var draggedID: String?
    @State private var dragOverIndex: Int?
    @State private var dropLinePosition: Int?

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(store.cities.enumerated()).dropFirst(), id: \.element.id) { index, city in
                if dropLinePosition == index {
                    DropLine()
                }
                CityRowView(
                    city: city,
                    clock: clock,
                    isRevealed: revealedID == city.id && draggedID == nil,
                    isDragging: draggedID == city.id,
                    isDraggedOver: dragOverIndex == index,
                    onDelete: {
                        revealedID = nil
                        store.remove(id: city.id)
                    }
                )
                .appear(.slideInUp, duration: 0.4, delay: Double(index) * Tokens.Motion.rowStagger)
                #if os(iOS)
                .onTapGesture { revealedID = revealedID == city.id ? nil : city.id }
                #else
                .onHover { hovering in
                    if hovering { revealedID = city.id } else if revealedID == city.id { revealedID = nil }
                }
                #endif
                .onDrag { dragStarted(city) }
                .onDrop(of: [.text], delegate: RowDropDelegate(
                    onEnter: { dragEntered(index) },
                    onExit: dragLeft,
                    onDrop: { dropped(on: index) }
                ))
            }
            if dropLinePosition == store.cities.count {
                DropLine()
            }
        }
        // Dropping between rows (e.g. on the drop line) still ends the drag cleanly.
        .onDrop(of: [.text], isTargeted: nil) { _ in
            dragEnded()
            return false
        }
        #if os(iOS)
        .sensoryFeedback(.impact(weight: .light), trigger: draggedID) { _, new in new != nil }
        #endif
    }

    // MARK: Drag to reorder (port of handleDragStart / handleDragOver / handleDragLeave / handleDrop)

    private func dragStarted(_ city: City) -> NSItemProvider {
        draggedID = city.id
        revealedID = nil
        let provider = DragItemProvider(object: city.id as NSString)
        // There is no "drag ended" callback; the provider is released when the session ends,
        // which covers drags that are cancelled or dropped outside the list.
        provider.onRelease = { dragEnded() }
        return provider
    }

    private func dragEntered(_ index: Int) {
        guard let draggedIndex = store.cities.firstIndex(where: { $0.id == draggedID }) else { return }
        dragOverIndex = index
        // Line below the target when dragging down, above it when dragging up.
        dropLinePosition = draggedIndex == index ? nil : (draggedIndex < index ? index + 1 : index)
    }

    private func dragLeft() {
        dragOverIndex = nil
        dropLinePosition = nil
    }

    private func dropped(on index: Int) -> Bool {
        defer { dragEnded() }
        guard let from = store.cities.firstIndex(where: { $0.id == draggedID }) else { return false }
        store.move(from: from, to: index)
        return true
    }

    private func dragEnded() {
        draggedID = nil
        dragOverIndex = nil
        dropLinePosition = nil
    }
}

private struct RowDropDelegate: DropDelegate {
    let onEnter: () -> Void
    let onExit: () -> Void
    let onDrop: () -> Bool

    func dropEntered(info: DropInfo) { onEnter() }
    func dropExited(info: DropInfo) { onExit() }
    func dropUpdated(info: DropInfo) -> DropProposal? { DropProposal(operation: .move) }
    func performDrop(info: DropInfo) -> Bool { onDrop() }
}

/// Item provider that reports when the system lets go of it (end of the drag session).
private final class DragItemProvider: NSItemProvider {
    var onRelease: (@MainActor @Sendable () -> Void)?

    deinit {
        guard let onRelease else { return }
        Task { @MainActor in onRelease() }
    }
}
