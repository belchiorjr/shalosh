import clsx from "clsx";
import type { CSSProperties, HTMLAttributes } from "react";

interface MaterialSymbolProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  filled?: boolean;
}

export function MaterialSymbol({
  name,
  filled = false,
  className,
  style,
  ...props
}: MaterialSymbolProps) {
  const iconStyle: CSSProperties = {
    fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`,
    ...style,
  };

  return (
    <span
      aria-hidden
      className={clsx("material-symbols-rounded leading-none", className)}
      style={iconStyle}
      {...props}
    >
      {name}
    </span>
  );
}
