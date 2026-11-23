import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";

export function header({ minHeight, padding = "0.5rem", borderBottom, backgroundColor = colors[theme][palette.base](1), color, gapLeading = "0.5rem", gapTrailing = "1rem", onclick, leading, title, trailing } = {}) {
  return {
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: 10,
    width: "100%",
    minHeight,
    padding,
    borderBottom,
    backgroundColor,
    color,
    ...styles.unselectable(),
    cursor: onclick ? "pointer" : undefined,
    ...handlers.button(onclick),
    ...layouts.row("space-between", "center", gapTrailing),
    children: [
      {
        minWidth: 0,
        ...layouts.row("start", "center", gapLeading),
        children: [
          leading,
          title
            ? {
                fontSize: "1.25rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                text: title,
              }
            : null,
        ],
      },
      trailing,
    ],
  };
}
