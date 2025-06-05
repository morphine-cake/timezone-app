import { ShareIcon } from "@heroicons/react/24/solid";

interface FooterProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Footer({ className = "", style = {} }: FooterProps) {
  const handleTwitterShare = () => {
    const text =
      "Check out Kairos - Smart World Clock & Timezone Converter 🌍⏰";
    const url = "https://kairos-timezone.netlify.app";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <footer
      className={`footer-container ${className}`}
      style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        width: "100%",
        paddingTop: "16px",
        paddingBottom: "16px",
        backgroundColor: "#121212",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        zIndex: "10",
        ...style,
      }}
    >
      <div
        className="footer-content"
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Credits Text */}
        <div
          className="credits-line"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div
            className="credits-text"
            style={{
              color: "#515151",
              fontFamily: "var(--font-fira-mono)",
              fontSize: "12px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "normal",
              letterSpacing: "1px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Design & Code Burak Başcı with Figma & Cursor
          </div>
        </div>

        {/* Social Links & Share Button */}
        <div
          className="social-links-line"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Twitter Link */}
          <a
            href="https://x.com/burak_basci"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#515151" }}
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Instagram Link */}
          <a
            href="https://www.instagram.com/brkbsc/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#515151" }}
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          {/* Share Button */}
          <button
            onClick={handleTwitterShare}
            style={{
              background: "none",
              border: "none",
              padding: "0",
              cursor: "pointer",
            }}
          >
            <ShareIcon
              style={{
                width: "14px",
                height: "14px",
                color: "#515151",
              }}
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
