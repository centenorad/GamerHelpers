import React from "react";
/**
 * Linear layout component
 * @param {Object} props
 * @param {"start"|"end"} props.direction - Alignment direction (start or end)
 * @param {"row"|"column"} props.orientation - Flex orientation (row or column)
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {any} [props.props]
 */
export function Linear({
  direction,
  orientation,
  children,
  className = "",
  ...props
}) {
  const flexDirection = orientation === "column" ? "flex-col" : "flex-row";
  const justify = direction === "end" ? "justify-end" : "justify-start";
  const align =
    orientation === "column"
      ? direction === "end"
        ? "items-end"
        : "items-start"
      : "items-center";
  const text = direction === "end" ? "text-right" : "text-left";
  return (
    <div
      className={`flex ${flexDirection} ${justify} ${align} ${text} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
export function Vertical({ children, className = "", ...props }) {
  return (
    <div className={`flex flex-col ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Horizontal({ children, className = "", ...props }) {
  return (
    <div className={`flex flex-row ${className}`} {...props}>
      {children}
    </div>
  );
}

export function FullScreen({ children, className = "", ...props }) {
  return (
    <div
      className={`w-screen h-screen min-h-screen min-w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Start({ children, className = "", ...props }) {
  return (
    <div
      className={`flex flex-row justify-start items-center text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Center({ children, className = "", ...props }) {
  return (
    <div
      className={`flex justify-center items-center text-center${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function End({ children, className = "", ...props }) {
  return (
    <div
      className={`flex flex-row justify-end items-center text-right ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function FullWidth({ children, className = "", ...props }) {
  return (
    <div className={`w-screen ${className}`} {...props}>
      {children}
    </div>
  );
}

export function FullHeight({ children, className = "", ...props }) {
  return (
    <div className={`h-screen ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SizeEvenly({ children, className = "", ...props }) {
  // Wrap each child in a div with flex-1, grow, min-w-0, min-h-0 to ensure even sizing and fill
  const evenChildren = React.Children.map(children, (child) => (
    <div className="flex-1 grow flex justify-center items-center min-w-0 min-h-0">
      {child}
    </div>
  ));
  return (
    <div
      className={`flex w-full flex-1 grow min-w-0 min-h-0 ${className}`}
      {...props}
    >
      {evenChildren}
    </div>
  );
}
