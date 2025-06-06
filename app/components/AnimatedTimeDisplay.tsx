"use client";

import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";

interface AnimatedTimeDisplayProps {
  timezone: string;
  timeOffset: number;
  className?: string;
  style?: React.CSSProperties;
}

interface DigitProps {
  digit: string;
  isAnimating: boolean;
  direction: "up" | "down" | null;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedDigit = ({
  digit,
  isAnimating,
  direction,
  className = "",
  style = {},
}: DigitProps) => {
  return (
    <div
      className={`digit-container relative inline-block overflow-hidden ${className}`}
      style={style}
    >
      <div
        className={`digit-display ${
          isAnimating
            ? direction === "up"
              ? "animate-time-from-top"
              : "animate-time-from-bottom"
            : ""
        }`}
        key={`${digit}-${isAnimating}`}
        style={{
          animationDuration: isAnimating ? "0.3s" : "0s",
          animationTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
          animationFillMode: "both",
        }}
      >
        {digit}
      </div>
    </div>
  );
};

export function AnimatedTimeDisplay({
  timezone,
  timeOffset,
  className = "",
  style = {},
}: AnimatedTimeDisplayProps) {
  const [displayTime, setDisplayTime] = useState("00:00");
  const [animatingDigits, setAnimatingDigits] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [animationDirections, setAnimationDirections] = useState<
    ("up" | "down" | null)[]
  >([null, null, null, null, null]);
  const prevTimeRef = useRef<string>("00:00");
  const prevOffsetRef = useRef<number>(timeOffset);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAdjustedTime = (timezone: string, offset: number) => {
    const baseTime = DateTime.now().plus({ hours: offset });
    return baseTime.setZone(timezone);
  };

  const formatTime = (dateTime: DateTime) => {
    return dateTime.toFormat("HH:mm");
  };

  const getDigitsFromTime = (time: string): string[] => {
    // Convert "12:34" to ["1", "2", ":", "3", "4"]
    return time.split("");
  };

  useEffect(() => {
    const newTime = formatTime(getAdjustedTime(timezone, timeOffset));
    const prevTime = prevTimeRef.current;
    const prevOffset = prevOffsetRef.current;
    const offsetChanged = prevOffset !== timeOffset;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (offsetChanged) {
      // Compare digits for animation
      const oldDigits = getDigitsFromTime(prevTime);
      const newDigits = getDigitsFromTime(newTime);
      const isIncreasing = timeOffset > prevOffset;

      const animating = new Array(5).fill(false);
      const directions: ("up" | "down" | null)[] = new Array(5).fill(null);

      for (let i = 0; i < 5; i++) {
        if (i === 2) continue; // Skip the colon ":"

        if (oldDigits[i] !== newDigits[i]) {
          animating[i] = true;
          directions[i] = isIncreasing ? "up" : "down";
        }
      }

      // Start animation
      setAnimatingDigits(animating);
      setAnimationDirections(directions);

      // Update the displayed time after a brief delay
      timeoutRef.current = setTimeout(() => {
        setDisplayTime(newTime);

        // Reset animation after completion
        timeoutRef.current = setTimeout(() => {
          setAnimatingDigits([false, false, false, false, false]);
          setAnimationDirections([null, null, null, null, null]);
        }, 300);
      }, 50);
    } else {
      // No offset change, just update time immediately (for real-time updates)
      setDisplayTime(newTime);
    }

    prevTimeRef.current = newTime;
    prevOffsetRef.current = timeOffset;
  }, [timezone, timeOffset]);

  // Initialize display time on mount
  useEffect(() => {
    const initialTime = formatTime(getAdjustedTime(timezone, timeOffset));
    setDisplayTime(initialTime);
    prevTimeRef.current = initialTime;
  }, [timezone, timeOffset]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const digits = getDigitsFromTime(displayTime);

  return (
    <div
      className={`animated-time-container relative ${className}`}
      style={style}
    >
      <div className="flex justify-end">
        {digits.map((digit, index) => (
          <AnimatedDigit
            key={index}
            digit={digit}
            isAnimating={animatingDigits[index]}
            direction={animationDirections[index]}
            className={digit === ":" ? "colon" : ""}
            style={{
              minWidth: digit === ":" ? "0.3em" : "0.6em",
              textAlign: "center",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
