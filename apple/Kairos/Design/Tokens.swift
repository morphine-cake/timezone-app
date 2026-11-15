import SwiftUI

/// Design tokens extracted from the web app (app/page.tsx, app/components/*, app/globals.css).
/// Keep these values in sync with the web so both look identical.
enum Tokens {
    enum Colors {
        static let background = Color(hex: 0x121212)
        static let textPrimary = Color.white
        static let textSecondary = Color(hex: 0xACACAC)
        static let textFooter = Color(hex: 0x515151)
        static let textDisabled = Color(hex: 0x666666)
        static let accent = Color(hex: 0xFF7C35)

        static let dividerReference = Color.white.opacity(0.25)
        static let dividerRow = Color.white.opacity(0.08)
        static let dividerSlider = Color.white.opacity(0.24)
        static let buttonBorder = Color.white.opacity(0.12)
        static let focusBorder = Color.white.opacity(0.2)
        static let fillHover = Color.white.opacity(0.04)
        static let fillPressed = Color.white.opacity(0.08)
        /// A city row while it is picked up.
        static let liftedRow = Color(hex: 0x1E1E1E)
    }

    enum Typography {
        static let cityName = TextStyle(font: .manropeRegular, size: 24, lineHeight: 32, tracking: 1)
        static let time = TextStyle(font: .geistMonoRegular, size: 24, lineHeight: 32, tracking: 2)
        static let meta = TextStyle(font: .firaMonoRegular, size: 12, lineHeight: 14, tracking: 1, uppercase: true)
        static let modalTitle = TextStyle(font: .manropeMedium, size: 24, lineHeight: 32, tracking: 0)
        static let search = TextStyle(font: .manropeRegular, size: 16, lineHeight: 24, tracking: 0)
        static let body = TextStyle(font: .manropeRegular, size: 16, lineHeight: 24, tracking: 0)
        /// Add City list uses CSS `line-height: normal`, i.e. the font's own line height.
        static let catalogCityName = TextStyle(font: .manropeRegular, size: 24, lineHeight: nil, tracking: 1)
        static let catalogMeta = TextStyle(font: .firaMonoRegular, size: 12, lineHeight: nil, tracking: 1, uppercase: true)
    }

    enum Layout {
        static let maxContentWidth: CGFloat = 560
        static let horizontalPadding: CGFloat = 24
        static let headerVerticalPadding: CGFloat = 24
        static let rowVerticalPadding: CGFloat = 24
        static let metaSpacing: CGFloat = 6
        static let iconButtonSize: CGFloat = 32
        static let iconButtonRadius: CGFloat = 8
        static let iconSize: CGFloat = 20
        static let pinIconSize: CGFloat = 16
        static let deleteSlideDistance: CGFloat = 48
        static let logoSize = CGSize(width: 139, height: 34)
        static let loadingLogoMaxSize = CGSize(width: 318, height: 78)
    }

    enum Slider {
        /// One tick per 15-minute step.
        static let stepWidth: CGFloat = 8
        static let topPadding: CGFloat = 24
        static let rulerHeight: CGFloat = 100
        static let bottomMargin: CGFloat = 16
        static let tickWidth: CGFloat = 1
        static let tickHeightRegular: CGFloat = 40
        static let tickHeightMedium: CGFloat = 50
        static let tickHeightMajor: CGFloat = 60
        static let tickOpacityRegular = 0.4
        static let tickOpacityMedium = 0.6
        static let tickOpacityMajor = 0.8
        static let needleWidth: CGFloat = 2
        static let needleHeight: CGFloat = 60
        static let needleOverhang: CGFloat = 24
        static let labelOffset: CGFloat = 8
        static let triangleSize = CGSize(width: 12, height: 8)
        static let triangleOffset: CGFloat = 12
        static let fadeWidth: CGFloat = 80
        static let doubleTapInterval: TimeInterval = 0.3
    }

    enum Motion {
        static let digitRoll = Animation.timingCurve(0.4, 0.0, 0.2, 1, duration: 0.3)
        static let rulerSettle = Animation.linear(duration: 0.4)
        static let resetToNowDuration: TimeInterval = 0.46
        static let logoRotationPeriod: TimeInterval = 60
        static let loadingScreenDuration: TimeInterval = 1.3
        static let appFadeIn = Animation.easeOut(duration: 0.6)
        static let referenceRowDelay: TimeInterval = 0.4
        static let rowSlideIn = Animation.easeOut(duration: 0.4)
        static let rowStagger: TimeInterval = 0.1
        static let sheet = Animation.easeOut(duration: 0.3)
        static let reorder = Animation.easeInOut(duration: 0.2)
        static let deleteReveal = Animation.easeInOut(duration: 0.3)
    }
}

/// A web text style: font, size, CSS line-height, letter-spacing and text-transform.
struct TextStyle {
    let font: KairosFont
    let size: CGFloat
    /// CSS line-height; nil means `normal` (the font's natural height).
    let lineHeight: CGFloat?
    let tracking: CGFloat
    var uppercase = false

    var swiftUIFont: Font { .custom(font.rawValue, fixedSize: size) }
}

extension View {
    /// Applies a web text style. Every Kairos label is a single line, so the CSS line box
    /// is reproduced exactly by giving the line a fixed height (text centered, like CSS).
    func textStyle(_ style: TextStyle) -> some View {
        font(style.swiftUIFont)
            .tracking(style.tracking)
            .textCase(style.uppercase ? .uppercase : nil)
            .lineLimit(1)
            .frame(height: style.lineHeight)
    }}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}
