import SwiftUI

@main
struct KairosApp: App {
    init() {
        KairosFont.registerAll()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
        }
        #if os(macOS)
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: Tokens.Layout.maxContentWidth, height: 760)
        #endif
    }
}
