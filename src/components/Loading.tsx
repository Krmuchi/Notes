import React from "react";

export interface LoadingProps {
  type?: "spinner" | "pulse" | "dots" | "wave" | "skeleton";
  size?: "small" | "medium" | "large";
  text?: string;
  color?: string;
}

export function Loading({ type = "spinner", size = "medium", text, color = "#2385bb" }: LoadingProps) {
  const sizeClasses = {
    small: "loading-small",
    medium: "loading-medium",
    large: "loading-large",
  };

  const renderSpinner = () => (
    <div className={`loading-spinner ${sizeClasses[size]}`} style={{ borderColor: color }}>
      <div className="spinner-inner" style={{ borderTopColor: color }} />
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse-container ${sizeClasses[size]}`}>
      <div className="pulse-dot" style={{ background: color }} />
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots ${sizeClasses[size]}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="dot"
          style={{
            background: color,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );

  const renderWave = () => (
    <div className={`loading-wave-container ${sizeClasses[size]}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            background: color,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  const renderSkeleton = () => (
    <div className="loading-skeleton">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );

  const renderLoading = () => {
    switch (type) {
      case "spinner":
        return renderSpinner();
      case "pulse":
        return renderPulse();
      case "dots":
        return renderDots();
      case "wave":
        return renderWave();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="loading-wrapper">
      {renderLoading()}
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
}

export interface SkeletonProps {
  lines?: number;
}

export function Skeleton({ lines = 3 }: SkeletonProps) {
  return (
    <div className="skeleton-wrapper">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}

export interface ButtonLoaderProps {
  loading?: boolean;
  children: React.ReactNode;
}

export function ButtonLoader({ loading, children }: ButtonLoaderProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <span className="button-loader">
      <span className="button-spinner" />
    </span>
  );
}