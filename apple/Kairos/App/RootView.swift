import Combine
import SwiftUI

/// The whole app screen (app/page.tsx): loading splash, sticky header with logo, "+" button,
/// time slider and reference city, the scrolling city list, and the Add City overlay.
struct RootView: View {
    @State private var store = CityStore(localCity: .local(catalog: .bundled))
    @Environment(\.scenePhase) private var scenePhase
    private let catalog = CityCatalog.bundled
    @State private var now = Date()
    @State private var offset = 0
    @State private var revealedID: String?
    @State private var isReordering = false
    @State private var reorderScroll = ReorderScroll()
    @State private var showsLoading = true
    @State private var showsAddCity = false
    @State private var query = ""

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var clock: ClockContext {
        ClockContext(now: now, offset: offset, reference: store.reference)
    }

    private var minute: Int { Calendar.current.component(.minute, from: now) }

    var body: some View {
        ZStack {
            Tokens.Colors.background.ignoresSafeArea()

            if showsLoading {
                LoadingView()
            } else {
                content
                    .appear(.fadeIn, duration: 0.6)
            }

            if showsAddCity {
                AddCityView(catalog: catalog, store: store, query: $query) {
                    showsAddCity = false
                }
            }
        }
        .onReceive(ticker) { now = $0 }
        // Catches a time zone change made while the app was suspended.
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { store.refreshLocalCity() }
        }
        .task {
            try? await Task.sleep(for: .seconds(Tokens.Motion.loadingScreenDuration))
            showsLoading = false
        }
        #if os(macOS)
        .frame(minWidth: 380, minHeight: 520)
        #endif
    }

    #if os(iOS)
    private static let bottomFadeHeight: CGFloat = 100
    private static let listBottomSpacing: CGFloat = 60
    #endif

    private var content: some View {
        VStack(spacing: 0) {
            #if os(iOS)
            // iPhone order: header, your time, scrolling city list, time slider.
            topBar
                .appear(.fadeIn, duration: 0.5, delay: 0.2)
            referenceBar
            cityScroll
                // Fades the bottom edge of the list into the slider.
                .mask {
                    VStack(spacing: 0) {
                        Color.black
                        LinearGradient(
                            stops: [
                                .init(color: .black, location: 0),
                                .init(color: .black.opacity(0.5), location: 0.45),
                                .init(color: .clear, location: 1),
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: Self.bottomFadeHeight)
                    }
                }
            sliderBar
            #else
            header
                .appear(.fadeIn, duration: 0.5, delay: 0.2)
            cityScroll
            #endif
        }
    }

    private var cityScroll: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 0) {
                    CityListView(store: store, clock: clock, revealedID: $revealedID, isReordering: $isReordering, scroll: reorderScroll)
                    // On iPhone the last row must be able to scroll above the bottom fade.
                    #if os(iOS)
                    Color.clear.frame(height: Self.listBottomSpacing)
                    #else
                    Color.clear.frame(height: Tokens.Layout.horizontalPadding)
                    #endif
                }
                .padding(.horizontal, Tokens.Layout.horizontalPadding)
                .frame(maxWidth: Tokens.Layout.maxContentWidth)
                .frame(maxWidth: .infinity)
            }
            .scrollIndicators(.hidden)
            .scrollDisabled(isReordering)
            // Lets the list scroll this view itself while a row is dragged to an edge.
            .scrollPosition(Bindable(reorderScroll).position)
            .onScrollGeometryChange(for: CGPoint.self) {
                CGPoint(x: $0.contentOffset.y, y: max($0.contentSize.height - $0.containerSize.height, 0))
            } action: { _, offsetAndMax in
                reorderScroll.y = offsetAndMax.x
                reorderScroll.maxY = offsetAndMax.y
            }
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { reorderScroll.viewport = $0 }
            .appear(.fadeIn, duration: 0.6, delay: 0.6)
        }
    }

    private var addCityButton: some View {
        BorderedIconButton(icon: "icon-plus", label: "Add city") {
            revealedID = nil
            showsAddCity = true
        }
    }

    #if os(iOS)
    private var topBar: some View {
        HStack {
            KairosLogo()
            Spacer()
            addCityButton
        }
        // No bottom padding: the reference row below already has its own 24 pt.
        .padding(.top, Tokens.Layout.headerVerticalPadding)
        .readableColumn()
    }

    private var referenceBar: some View {
        ReferenceRowView(city: store.reference, clock: clock)
            .appear(.slideInUp, duration: 0.5, delay: Tokens.Motion.referenceRowDelay)
            .readableColumn()
    }

    private var sliderBar: some View {
        TimeSliderView(offset: $offset, minute: minute)
            .readableColumn()
    }
    #endif

    private var header: some View {
        VStack(spacing: 0) {
            HStack {
                KairosLogo()
                Spacer()
                addCityButton
            }
            .padding(.vertical, Tokens.Layout.headerVerticalPadding)

            TimeSliderView(offset: $offset, minute: minute)

            ReferenceRowView(city: store.reference, clock: clock)
                .appear(.slideInUp, duration: 0.5, delay: Tokens.Motion.referenceRowDelay)
        }
        .readableColumn()
    }
}

private extension View {
    /// The centered, margin-padded column every bar of the screen sits in, on the screen background.
    func readableColumn() -> some View {
        padding(.horizontal, Tokens.Layout.horizontalPadding)
            .frame(maxWidth: Tokens.Layout.maxContentWidth)
            .frame(maxWidth: .infinity)
            .background(Tokens.Colors.background)
    }
}

#Preview {
    RootView()
}
