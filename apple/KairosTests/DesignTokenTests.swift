import CoreText
import Testing
@testable import Kairos

struct DesignTokenTests {
    @Test("Bundled fonts register and resolve by PostScript name", arguments: KairosFont.allCases)
    func fontIsAvailable(font: KairosFont) {
        KairosFont.registerAll()
        let resolved = CTFontCreateWithName(font.rawValue as CFString, 12, nil)
        #expect(CTFontCopyPostScriptName(resolved) as String == font.rawValue)
    }
}
