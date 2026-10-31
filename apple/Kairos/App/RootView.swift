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

    private var content: some View {
        VStack(spacing: 0) {
            header
                .appear(.fadeIn, duration: 0.5, delay: 0.2)

            ScrollView {
                VStack(spacing: 0) {
                    CityListView(store: store, clock: clock, revealedID: $revealedID)
                    Color.clear.frame(height: Tokens.Layout.horizontalPadding)
                }
                .padding(.horizontal, Tokens.Layout.horizontalPadding)
                .frame(maxWidth: Tokens.Layout.maxContentWidth)
                .frame(maxWidth: .infinity)
                #if os(iOS)
                // Tapping outside a row hides the revealed delete button (mobile web "mouseleave").
                .background {
                    Color.clear
                        .contentShape(Rectangle())
                        .onTapGesture { revealedID = nil }
                }
                #endif
            }
            .scrollIndicators(.hidden)
            .appear(.fadeIn, duration: 0.6, delay: 0.6)
        }
    }

    private var header: some View {
        VStack(spacing: 0) {
            HStack {
                KairosLogo()
                Spacer()
                BorderedIconButton(icon: "icon-plus", label: "Add city") {
                    revealedID = nil
                    showsAddCity = true
                }
            }
            .padding(.vertical, Tokens.Layout.headerVerticalPadding)

            TimeSliderView(offset: $offset, minute: minute)

            ReferenceRowView(city: store.reference, clock: clock)
                .appear(.slideInUp, duration: 0.5, delay: Tokens.Motion.referenceRowDelay)
        }
        .padding(.horizontal, Tokens.Layout.horizontalPadding)
        .frame(maxWidth: Tokens.Layout.maxContentWidth)
        .frame(maxWidth: .infinity)
        .background(Tokens.Colors.background)
    }
}

#Preview {
    RootView()
}
