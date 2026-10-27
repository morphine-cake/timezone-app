import SwiftUI

/// Header logo: static wordmark plus the ring that turns once every 60 s (app/page.tsx `KairosLogo`).
struct KairosLogo: View {
    @State private var angle = Angle.zero

    var body: some View {
        ZStack(alignment: .leading) {
            Image("logo-wordmark")
                .resizable()
                .frame(width: Tokens.Layout.logoSize.width, height: Tokens.Layout.logoSize.height)
            Image("logo-ring")
                .resizable()
                .frame(width: Tokens.Layout.logoSize.height, height: Tokens.Layout.logoSize.height)
                .rotationEffect(angle)
        }
        .onAppear {
            withAnimation(.linear(duration: Tokens.Motion.logoRotationPeriod).repeatForever(autoreverses: false)) {
                angle = .degrees(360)
            }
        }
        .accessibilityLabel("Kairos")
    }
}

/// Heroicon from the asset catalog, tinted like `currentColor`.
struct Icon: View {
    let name: String
    var size: CGFloat = Tokens.Layout.iconSize

    var body: some View {
        Image(name)
            .resizable()
            .renderingMode(.template)
            .frame(width: size, height: size)
    }
}

/// 32×32 button with a border: the web's "+" and "×" buttons.
/// Background: hover white 4 %, pressed white 8 %.
struct BorderedIconButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            Icon(name: icon)
        }
        .buttonStyle(IconButtonStyle(
            isHovered: isHovered,
            hover: Tokens.Colors.fillHover,
            pressed: Tokens.Colors.fillPressed,
            border: Tokens.Colors.buttonBorder
        ))
        .onHover { isHovered = $0 }
        .accessibilityLabel(label)
    }
}

struct IconButtonStyle: ButtonStyle {
    let isHovered: Bool
    let hover: Color
    let pressed: Color
    var border: Color = .clear

    func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: Tokens.Layout.iconButtonRadius)
        configuration.label
            .foregroundStyle(Tokens.Colors.textPrimary)
            .frame(width: Tokens.Layout.iconButtonSize, height: Tokens.Layout.iconButtonSize)
            .background(configuration.isPressed ? pressed : isHovered ? hover : .clear, in: shape)
            .overlay(shape.strokeBorder(border, lineWidth: 1))
            .contentShape(shape)
            .animation(.easeInOut(duration: 0.15), value: isHovered)
    }
}

// MARK: - Appear animations (CSS keyframes in app/globals.css)

enum AppearEffect {
    /// `fadeIn`: opacity 0→1, translateY 20→0
    case fadeIn
    /// `slideInUp`: opacity 0→1, translateY 30→0, scale 0.98→1
    case slideInUp
}

private struct AppearModifier: ViewModifier {
    let effect: AppearEffect
    let duration: TimeInterval
    let delay: TimeInterval
    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : (effect == .fadeIn ? 20 : 30))
            .scaleEffect(shown || effect == .fadeIn ? 1 : 0.98)
            .onAppear {
                withAnimation(.easeOut(duration: duration).delay(delay)) { shown = true }
            }
    }
}

extension View {
    func appear(_ effect: AppearEffect, duration: TimeInterval, delay: TimeInterval = 0) -> some View {
        modifier(AppearModifier(effect: effect, duration: duration, delay: delay))
    }
}

// MARK: - Loading

/// 1.3 s splash with the Kairos logo image (the web's loading screen).
struct LoadingView: View {
    var body: some View {
        Image("kairos-logo")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(maxWidth: Tokens.Layout.loadingLogoMaxSize.width, maxHeight: Tokens.Layout.loadingLogoMaxSize.height)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Tokens.Colors.background.ignoresSafeArea())
    }
}
