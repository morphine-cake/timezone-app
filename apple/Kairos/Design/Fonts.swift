import CoreText
import Foundation

/// Bundled typefaces. Same families as the web app (`next/font/google` in app/layout.tsx).
enum KairosFont: String, CaseIterable {
    case manropeRegular = "Manrope-Regular"
    case manropeMedium = "Manrope-Medium"
    case firaMonoRegular = "FiraMono-Regular"

    /// Registers the bundled .ttf files for this process. Done in code instead of
    /// UIAppFonts / ATSApplicationFontsPath so one mechanism works on iOS and macOS.
    static func registerAll(in bundle: Bundle = .main) {
        for font in allCases {
            guard let url = bundle.url(forResource: font.rawValue, withExtension: "ttf") else {
                assertionFailure("Missing font file \(font.rawValue).ttf")
                continue
            }
            // Fails harmlessly with "already registered" on repeat calls.
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}
