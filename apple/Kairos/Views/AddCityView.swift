import SwiftUI

/// Full-screen "Add City" overlay (app/components/CitySelectionModal.tsx).
/// Opens with fade + scale 0.95→1 + 20 pt rise; header, search and list follow 0.1 s apart.
struct AddCityView: View {
    let catalog: CityCatalog
    let store: CityStore
    @Binding var query: String
    let onDismiss: () -> Void

    @State private var isVisible = false
    @State private var focusedIndex: Int?
    @FocusState private var isSearchFocused: Bool

    private var results: [City] { catalog.search(query) }

    var body: some View {
        VStack(spacing: 0) {
            header
                .staged(isVisible, delay: 0.1, rise: -20)
            searchField
                .staged(isVisible, delay: 0.2, rise: -20)
            list
                .staged(isVisible, delay: 0.3, rise: 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .scaleEffect(isVisible ? 1 : 0.95)
        .offset(y: isVisible ? 0 : 20)
        .background(Tokens.Colors.background.ignoresSafeArea())
        .opacity(isVisible ? 1 : 0)
        .animation(Tokens.Motion.sheet, value: isVisible)
        .onAppear {
            isVisible = true
            isSearchFocused = true
        }
        .onChange(of: query) { focusedIndex = nil }
        #if os(macOS)
        .onExitCommand(perform: close)
        #endif
    }

    // MARK: Parts

    private var header: some View {
        HStack {
            Text("Add City")
                .textStyle(Tokens.Typography.modalTitle)
                .foregroundStyle(Tokens.Colors.textPrimary)
            Spacer()
            BorderedIconButton(icon: "icon-xmark", label: "Close", action: close)
        }
        .padding(Tokens.Layout.horizontalPadding)
        .frame(maxWidth: Tokens.Layout.maxContentWidth)
    }

    private var searchField: some View {
        let shape = RoundedRectangle(cornerRadius: 10)
        return ZStack(alignment: .leading) {
            TextField(
                "",
                text: $query,
                prompt: Text("Search cities or countries...").foregroundStyle(Color.white.opacity(0.5))
            )
            .textFieldStyle(.plain)
            .font(Tokens.Typography.search.swiftUIFont)
            .foregroundStyle(Tokens.Colors.textPrimary)
            .tint(Tokens.Colors.textPrimary)
            .focused($isSearchFocused)
            .autocorrectionDisabled()
            #if os(iOS)
            .textInputAutocapitalization(.never)
            .submitLabel(.done)
            #endif
            .frame(height: Tokens.Typography.search.lineHeight)
            .padding(.leading, 40)
            .padding(.trailing, 16)
            .padding(.vertical, 12)
            .background(Tokens.Colors.background, in: shape)
            .overlay(shape.strokeBorder(Tokens.Colors.buttonBorder, lineWidth: 1))
            .overlay(shape.inset(by: -1).stroke(Color.white, lineWidth: 1).opacity(isSearchFocused ? 1 : 0))
            .onSubmit(selectFocused)
            .onKeyPress(.downArrow) { moveFocus(1); return .handled }
            .onKeyPress(.upArrow) { moveFocus(-1); return .handled }
            .onKeyPress(.escape) { close(); return .handled }

            Icon(name: "icon-search")
                .foregroundStyle(Tokens.Colors.textPrimary)
                .padding(.leading, 12)
                .allowsHitTesting(false)
        }
        .padding(.horizontal, Tokens.Layout.horizontalPadding)
        .padding(.bottom, 24)
        .frame(maxWidth: Tokens.Layout.maxContentWidth)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Tokens.Colors.dividerRow).frame(height: 1)
        }
    }

    @ViewBuilder
    private var list: some View {
        let cities = results
        if cities.isEmpty {
            Text("No cities found")
                .font(Tokens.Typography.body.swiftUIFont)
                .foregroundStyle(Color(hex: 0x99A1AF))
                .frame(maxWidth: .infinity)
                .frame(height: 128)
        } else {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(Array(cities.enumerated()), id: \.element.id) { index, city in
                            CatalogRow(
                                city: city,
                                isAdded: store.contains(city),
                                isFocused: focusedIndex == index,
                                onHover: { focusedIndex = index },
                                action: { select(city) }
                            )
                            .id(city.id)
                        }
                    }
                    .frame(maxWidth: 512)
                    .padding(.horizontal, Tokens.Layout.horizontalPadding)
                    .frame(maxWidth: .infinity)
                }
                .scrollDismissesKeyboard(.immediately)
                .onChange(of: focusedIndex) { _, index in
                    guard let index, cities.indices.contains(index) else { return }
                    withAnimation { proxy.scrollTo(cities[index].id) }
                }
            }
        }
    }

    // MARK: Actions

    private func moveFocus(_ delta: Int) {
        let count = results.count
        guard count > 0 else { return }
        guard let current = focusedIndex else {
            focusedIndex = delta > 0 ? 0 : count - 1
            return
        }
        focusedIndex = (current + delta + count) % count
    }

    private func selectFocused() {
        guard let index = focusedIndex, results.indices.contains(index) else { return }
        select(results[index])
    }

    private func select(_ city: City) {
        guard !store.contains(city) else { return }
        store.add(city)
        close()
    }

    private func close() {
        guard isVisible else { return }
        isSearchFocused = false
        isVisible = false
        Task {
            try? await Task.sleep(for: .seconds(0.3))
            onDismiss()
        }
    }
}

/// One result: name, "COUNTRY / ABBR GMT+X", and "ADDED" for cities already in the list.
private struct CatalogRow: View {
    let city: City
    let isAdded: Bool
    let isFocused: Bool
    let onHover: () -> Void
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text(city.name)
                        .textStyle(Tokens.Typography.catalogCityName)
                        .foregroundStyle(Tokens.Colors.textPrimary)
                        .opacity(isAdded ? 0.6 : 1)
                    Text(TimeMath.catalogSubtitle(for: city, at: Date()))
                        .textStyle(Tokens.Typography.catalogMeta)
                        .foregroundStyle(Tokens.Colors.textSecondary)
                }
                Spacer(minLength: 8)
                if isAdded {
                    Text("Added")
                        .textStyle(Tokens.Typography.catalogMeta)
                        .foregroundStyle(Tokens.Colors.textSecondary)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(CatalogRowStyle(isAdded: isAdded, isFocused: isFocused))
        .disabled(isAdded)
        .onHover { if $0 { onHover() } }
    }
}

private struct CatalogRowStyle: ButtonStyle {
    let isAdded: Bool
    let isFocused: Bool

    func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: 10)
        let fill: Color = if configuration.isPressed && !isAdded {
            .white.opacity(0.8)
        } else if isFocused {
            Tokens.Colors.fillPressed
        } else if isAdded {
            Tokens.Colors.fillHover
        } else {
            .clear
        }
        configuration.label
            .background(fill, in: shape)
            .overlay(shape.strokeBorder(isFocused ? Tokens.Colors.focusBorder : .clear, lineWidth: 1))
    }
}

private extension View {
    /// Staggered section entrance/exit used inside the Add City screen.
    func staged(_ visible: Bool, delay: TimeInterval, rise: CGFloat) -> some View {
        opacity(visible ? 1 : 0)
            .offset(y: visible ? 0 : rise)
            .animation(Tokens.Motion.sheet.delay(delay), value: visible)
    }
}
