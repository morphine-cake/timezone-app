"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TimeSliderProps {
  onTimeOffsetChange: (offsetHours: number) => void;
  currentOffset: number;
}

export function TimeSlider({
  onTimeOffsetChange,
  currentOffset,
}: TimeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rulerOffset, setRulerOffset] = useState(0);
  const [continuousOffset, setContinuousOffset] = useState(0); // For smooth continuous dragging
  const [velocity, setVelocity] = useState(0); // For momentum effects
  const [lastPointerX, setLastPointerX] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  const HOUR_WIDTH = 8; // Width per hour (each line = 1 hour, 8px spacing)
  const VISIBLE_LINES = 200; // Number of hours to render (enough for smooth infinite scroll)
  const MOMENTUM_DECAY = 0.95; // How quickly momentum decays
  const MIN_VELOCITY = 0.1; // Minimum velocity before stopping momentum

  useEffect(() => {
    // Set ruler offset based on current time offset
    // Drag left = positive hours (future), drag right = negative hours (past)
    const targetOffset = -currentOffset * HOUR_WIDTH;
    setRulerOffset(targetOffset);
    setContinuousOffset(targetOffset);
  }, [currentOffset]);

  // Smooth momentum animation
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocity) < MIN_VELOCITY) {
      setVelocity(0);
      return;
    }

    const newOffset = continuousOffset + velocity;
    setContinuousOffset(newOffset);
    setRulerOffset(newOffset);

    // Update discrete hour offset
    // Drag left = positive hours (future), drag right = negative hours (past)
    const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
    onTimeOffsetChange(newHourOffset);

    // Apply decay
    const newVelocity = velocity * MOMENTUM_DECAY;
    setVelocity(newVelocity);

    animationFrameRef.current = requestAnimationFrame(animateMomentum);
  }, [velocity, continuousOffset, onTimeOffsetChange]);

  useEffect(() => {
    if (!isDragging && Math.abs(velocity) > MIN_VELOCITY) {
      animationFrameRef.current = requestAnimationFrame(animateMomentum);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, velocity, animateMomentum]);

  // Unified start handler for all input types
  const handleStart = (
    clientX: number,
    event: React.TouchEvent | React.PointerEvent | React.MouseEvent
  ) => {
    setIsDragging(true);
    setVelocity(0); // Stop any momentum
    setLastPointerX(clientX);
    setLastMoveTime(Date.now());

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Only prevent default for non-touch events to avoid scroll issues
    if (event.type !== "touchstart") {
      event.preventDefault();
    }
  };

  // Touch-specific start handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e);
    }
  };

  // Pointer start handler
  const handlePointerDown = (e: React.PointerEvent) => {
    // Skip if this is a touch event (will be handled by touch handler)
    if (e.pointerType === "touch") return;
    handleStart(e.clientX, e);
  };

  // Mouse start handler for legacy support
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle if it's not a touch event
    if (e.nativeEvent instanceof MouseEvent && e.nativeEvent.detail !== 0) {
      handleStart(e.clientX, e);
    }
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTime;
      const deltaX = e.clientX - lastPointerX;

      // Calculate velocity for momentum
      if (deltaTime > 0) {
        const currentVelocity = (deltaX / deltaTime) * 16; // Normalize to ~60fps
        setVelocity(currentVelocity * 0.3 + velocity * 0.7); // Smooth velocity averaging
      }

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.clientX);
      setLastMoveTime(currentTime);
    },
    [
      isDragging,
      lastPointerX,
      lastMoveTime,
      continuousOffset,
      velocity,
      onTimeOffsetChange,
    ]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current || e.touches.length !== 1) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTime;
      const deltaX = e.touches[0].clientX - lastPointerX;

      // Calculate velocity for momentum
      if (deltaTime > 0) {
        const currentVelocity = (deltaX / deltaTime) * 16; // Normalize to ~60fps
        setVelocity(currentVelocity * 0.3 + velocity * 0.7); // Smooth velocity averaging
      }

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.touches[0].clientX);
      setLastMoveTime(currentTime);

      // Always prevent default for touch move to stop scrolling during drag
      e.preventDefault();
    },
    [
      isDragging,
      lastPointerX,
      lastMoveTime,
      continuousOffset,
      velocity,
      onTimeOffsetChange,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTime;
      const deltaX = e.clientX - lastPointerX;

      // Calculate velocity for momentum
      if (deltaTime > 0) {
        const currentVelocity = (deltaX / deltaTime) * 16; // Normalize to ~60fps
        setVelocity(currentVelocity * 0.3 + velocity * 0.7); // Smooth velocity averaging
      }

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.clientX);
      setLastMoveTime(currentTime);
    },
    [
      isDragging,
      lastPointerX,
      lastMoveTime,
      continuousOffset,
      velocity,
      onTimeOffsetChange,
    ]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    // Momentum will be handled by the animation loop
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Momentum will be handled by the animation loop
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Momentum will be handled by the animation loop
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Add all event types for maximum compatibility
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent scrolling on mobile during drag
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Restore scrolling
        document.body.style.overflow = "";
      };
    }
  }, [
    isDragging,
    handlePointerMove,
    handlePointerUp,
    handleTouchMove,
    handleTouchEnd,
    handleMouseMove,
    handleMouseUp,
  ]);

  // Generate ruler lines with infinite scroll (each line = 1 hour)
  const generateRulerLines = () => {
    const lines = [];
    // Calculate the range of hours to show based on current offset
    const centerHour = Math.round(-rulerOffset / HOUR_WIDTH);
    const startHour = centerHour - Math.floor(VISIBLE_LINES / 2);
    const endHour = centerHour + Math.ceil(VISIBLE_LINES / 2);

    for (let hour = startHour; hour < endHour; hour++) {
      // Major hour marks every 6 hours (00, 06, 12, 18)
      const isMajorHour = ((hour % 6) + 6) % 6 === 0;
      // Every 3rd hour gets medium height (03, 09, 15, 21)
      const isMediumHour = ((hour % 3) + 3) % 3 === 0 && !isMajorHour;

      lines.push(
        <div
          key={hour}
          className={`ruler-line ${
            isMajorHour
              ? "ruler-line--major"
              : isMediumHour
              ? "ruler-line--medium"
              : "ruler-line--regular"
          }`}
          style={{
            position: "absolute",
            left: `${hour * HOUR_WIDTH}px`,
            width: "1px",
            height: isMajorHour ? "60px" : isMediumHour ? "50px" : "40px",
            backgroundColor: isMajorHour
              ? "rgba(255, 255, 255, 0.8)"
              : isMediumHour
              ? "rgba(255, 255, 255, 0.6)"
              : "rgba(255, 255, 255, 0.4)",
            bottom: "0",
          }}
        />
      );
    }
    return lines;
  };

  return (
    <div
      className="time-slider-container"
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        marginBottom: "16px",
        position: "relative", // Add relative positioning for fadeaway positioning
        borderTop: "1px solid rgba(255, 255, 255, 0.24)",
      }}
    >
      {/* Time Slider Section */}
      <div className="time-slider-inner">
        {/* Timeline Ruler */}
        <div
          ref={sliderRef}
          className="time-dial-ruler"
          style={{
            position: "relative",
            width: "100%",
            height: "100px",
            backgroundColor: "#121212",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            overflow: "hidden",
            touchAction: "pan-x", // Allow horizontal panning for touch devices
            WebkitTouchCallout: "none", // Disable iOS callout
            WebkitUserSelect: "none", // Disable text selection on iOS
            WebkitOverflowScrolling: "touch", // Better iOS scrolling
            minHeight: "60px", // Larger touch target for mobile
          }}
          onTouchStart={handleTouchStart}
          onPointerDown={handlePointerDown}
          onMouseDown={handleMouseDown}
        >
          {/* Time Range Rectangle - shows between current time and selected time */}
          {currentOffset !== 0 && (
            <div
              className="time-range-rectangle"
              style={{
                position: "absolute",
                left:
                  currentOffset > 0
                    ? "50%"
                    : `calc(50% + ${currentOffset * HOUR_WIDTH}px)`,
                width: `${Math.abs(currentOffset * HOUR_WIDTH)}px`,
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                zIndex: 1,
              }}
            />
          )}

          {/* Ruler Lines Container */}
          <div
            className="ruler-lines-container"
            style={{
              position: "absolute",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              transform: `translateX(${rulerOffset}px)`,
              width: `${VISIBLE_LINES * HOUR_WIDTH}px`,
              // Remove transition during dragging for immediate response
              // Only use transition when not dragging and no momentum
              transition:
                isDragging || Math.abs(velocity) > MIN_VELOCITY
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",
              willChange: "transform", // Optimize for animations
            }}
          >
            {generateRulerLines()}
          </div>
        </div>

        {/* Fixed Orange Line - positioned within time-slider-section */}
        <div
          className="current-time-line current-time-line--dial"
          style={{
            position: "absolute",
            top: "-24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "2px",
            height: "60px",
            backgroundColor: "#FF7C35",
            zIndex: 10,
          }}
        />

        {/* Current Time Text - positioned to the right of orange line */}
        <div
          className="current-time-text"
          style={{
            position: "absolute",
            top: "-24px", // Align with top of orange line extension
            left: "calc(50% + 8px)", // 8px to the right of the orange line center
            color: "#FF7C35",
            fontSize: "12px",
            lineHeight: "14px",
            fontFamily: "var(--font-fira-mono)",
            fontWeight: "400",
            letterSpacing: "1px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            zIndex: 11,
          }}
        >
          {currentOffset === 0
            ? "CURRENT TIME"
            : `${currentOffset > 0 ? "+" : ""}${currentOffset}H`}
        </div>

        {/* Moving Triangle - Shows where current time appears on dial (positioned below dial) */}
        <div
          className="current-time-triangle"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-12px", // Position below the dial
            transform: `translateX(calc(-50% + ${
              currentOffset * HOUR_WIDTH
            }px))`,
            width: "0",
            height: "0",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "8px solid #FF7C35",
            zIndex: 11,
          }}
        />
      </div>

      {/* Left Gradient Fadeaway - covers entire dial section including triangle area */}
      <div
        className="dial-fadeaway dial-fadeaway--left"
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "80px",
          height: "calc(100% + 20px)", // Extend beyond container to cover triangle
          background: "linear-gradient(to right, #121212, transparent)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      />

      {/* Right Gradient Fadeaway - covers entire dial section including triangle area */}
      <div
        className="dial-fadeaway dial-fadeaway--right"
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          width: "80px",
          height: "calc(100% + 20px)", // Extend beyond container to cover triangle
          background: "linear-gradient(to left, #121212, transparent)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
