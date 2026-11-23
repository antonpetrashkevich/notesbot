import { theme } from "xpl_kit";
import { colors } from "../colors/colors";
import { palette } from "../colors/palette";

export function modal() {
  return {
    width: "min(640px, 100% - 1rem)",
    maxHeight: "calc(100% - 1rem)",
    padding: "0.75rem",
    border: `1px solid ${colors[theme][palette.base](7)}`,
    borderRadius: "0.5rem",
    backgroundColor: colors.background.base(),
    overflow: "auto",
  };
}
