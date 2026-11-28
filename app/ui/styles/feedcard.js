import { theme, colors } from "xpl_kit";
import { palette, colors as albaColors } from "alba";

export function feedCard() {
  return {
    width: "100%",
    borderRadius: "0.75rem",
    border: `1px solid ${colors[theme][palette.base](7)}`,
    backgroundColor: albaColors.background.base(),
    overflow: "hidden",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  };
}
