import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";

export function toggle({ width = "100%", minWidth, maxWidth, height, minHeight, maxHeight, flexBasis, flexShrink = 0, flexGrow, color, disabled, value, onclick, iconFalse, iconTrue, text } = {}) {
  return {
    width,
    minWidth,
    maxWidth,
    height,
    minHeight,
    maxHeight,
    flexBasis,
    flexShrink,
    flexGrow,
    color,
    cursor: "pointer",
    ...(disabled ? styles.disabled() : {}),
    ...styles.unselectable(),
    disabled,
    onclick: disabled ? undefined : onclick,
    ...layouts.row("start", "center", "0.5rem"),
    children: [
      value ? iconTrue : iconFalse,
      {
        text,
      },
    ],
  };
}
