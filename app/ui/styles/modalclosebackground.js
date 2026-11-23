import { theme } from "xpl_kit";
import { colors } from "../colors/colors";
import { palette } from "../colors/palette";

export function modalCloseBackground() {
  return {
    backgroundColor: colors[theme][palette.base](2, true),
    backdropFilter: "blur(16px) saturate(180%)",
  };
}
