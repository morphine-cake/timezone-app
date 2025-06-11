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
  const [continuousOffset, setContinuousOffset] = useState(0);
  const [lastPointerX, setLastPointerX] = useState(0);

  // Double-click/tap state management
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAnimatingToCenter, setIsAnimatingToCenter] = useState(false);
  const stepAnimationRef = useRef<NodeJS.Timeout | null>(null);

  const HOUR_WIDTH = 8; // Width per hour (each line = 1 hour, 8px spacing)
  const VISIBLE_LINES = 200; // Number of hours to render (enough for smooth infinite scroll)
  const DOUBLE_TAP_DELAY = 300; // ms for double tap detection
  const TOTAL_ANIMATION_DURATION = 460; // ms for the entire countdown animation

  useEffect(() => {
    // Set ruler offset based on current time offset
    // Drag left = positive hours (future), drag right = negative hours (past)
    const targetOffset = -currentOffset * HOUR_WIDTH;
    setRulerOffset(targetOffset);
    setContinuousOffset(targetOffset);
  }, [currentOffset]);

  // Double-click/tap handler
  const handleDoubleClick = useCallback(() => {
    if (currentOffset === 0) return; // Already at current time

    // Stop any existing animations
    setIsDragging(false);
    if (stepAnimationRef.current) {
      clearTimeout(stepAnimationRef.current);
    }

    // Start step-by-step animation to center
    setIsAnimatingToCenter(true);

    // Calculate delay per step for consistent 460ms total duration
    const totalSteps = Math.abs(currentOffset);
    const stepDelay =
      totalSteps > 1
        ? TOTAL_ANIMATION_DURATION / totalSteps
        : TOTAL_ANIMATION_DURATION;

    // Determine direction (positive means count down, negative means count up)
    const direction = currentOffset > 0 ? -1 : 1;
    let stepOffset = currentOffset;

    const animateStep = () => {
      // Move one step toward zero
      stepOffset += direction;

      // Update the visual position
      const targetRulerOffset = -stepOffset * HOUR_WIDTH;
      setContinuousOffset(targetRulerOffset);
      setRulerOffset(targetRulerOffset);
      onTimeOffsetChange(stepOffset);

      // Check if we've reached current time (0)
      if (stepOffset === 0) {
        setIsAnimatingToCenter(false);
        return;
      }

      // Continue to next step
      stepAnimationRef.current = setTimeout(animateStep, stepDelay);
    };

    // Start the step animation
    animateStep();
  }, [currentOffset, onTimeOffsetChange]);

  // Handle double tap for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const currentTime = Date.now();

      // Check for double tap
      if (currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
        // Clear any existing timeout
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          setTapTimeout(null);
        }

        // Handle double tap
        handleDoubleClick();
        setLastTapTime(0); // Reset to prevent triple tap
        return;
      }

      setLastTapTime(currentTime);

      // Set timeout to clear the tap state
      const timeout = setTimeout(() => {
        setLastTapTime(0);
        setTapTimeout(null);
      }, DOUBLE_TAP_DELAY);
      setTapTimeout(timeout);

      handleStart(e.touches[0].clientX, e);
    }
  };

  // Unified start handler for all input types
  const handleStart = (
    clientX: number,
    event: React.TouchEvent | React.PointerEvent | React.MouseEvent
  ) => {
    setIsDragging(true);
    setLastPointerX(clientX);

    // Only prevent default for non-touch events to avoid scroll issues
    if (event.type !== "touchstart") {
      event.preventDefault();
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

      const deltaX = e.clientX - lastPointerX;

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.clientX);
    },
    [isDragging, lastPointerX, continuousOffset, onTimeOffsetChange]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - lastPointerX;

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.touches[0].clientX);

      // Always prevent default for touch move to stop scrolling during drag
      e.preventDefault();
    },
    [isDragging, lastPointerX, continuousOffset, onTimeOffsetChange]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const deltaX = e.clientX - lastPointerX;

      // Update continuous offset for ultra-smooth dragging
      const newOffset = continuousOffset + deltaX;
      setContinuousOffset(newOffset);
      setRulerOffset(newOffset);

      // Update discrete hour offset for the parent component
      // Drag left = positive hours (future), drag right = negative hours (past)
      const newHourOffset = -Math.round(newOffset / HOUR_WIDTH);
      onTimeOffsetChange(newHourOffset);

      setLastPointerX(e.clientX);
    },
    [isDragging, lastPointerX, continuousOffset, onTimeOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

  // Calculate smooth positioning values for visual elements
  // Use rulerOffset during dragging or step animation for smooth alignment with ruler lines
  // Use currentOffset when not dragging for discrete behavior
  const visualOffset =
    isDragging || isAnimatingToCenter
      ? -rulerOffset / HOUR_WIDTH
      : currentOffset;

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
      if (stepAnimationRef.current) {
        clearTimeout(stepAnimationRef.current);
      }
    };
  }, [tapTimeout]);

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
          onDoubleClick={handleDoubleClick}
        >
          {/* Time Range Rectangle - shows between current time and selected time */}
          {visualOffset !== 0 && (
            <div
              className="time-range-rectangle"
              style={{
                position: "absolute",
                left:
                  visualOffset > 0
                    ? `calc(50% + ${-visualOffset * HOUR_WIDTH}px)`
                    : "50%",
                width: `${Math.abs(visualOffset * HOUR_WIDTH)}px`,
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                zIndex: 1,
                transition:
                  isDragging || isAnimatingToCenter
                    ? "none"
                    : "left 0.4s linear, width 0.4s linear", // No transition during dragging or step animation for smooth alignment
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
              // Use linear transition for stepped feel, disable during dragging or step animation for immediate response
              transition:
                isDragging || isAnimatingToCenter
                  ? "none"
                  : "transform 0.4s linear",
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
              -visualOffset * HOUR_WIDTH
            }px))`,
            width: "0",
            height: "0",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "8px solid #FF7C35",
            zIndex: 11,
            transition:
              isDragging || isAnimatingToCenter
                ? "none"
                : "transform 0.4s linear", // No transition during dragging or step animation for smooth alignment
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
