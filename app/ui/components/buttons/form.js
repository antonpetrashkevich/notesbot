import { theme, smallViewport } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { icon } from "../glyphs/icon";

export function form({ priority, smallViewportGrow = true, disabled, href, onclick, ligature, text } = {}) {
  let backgroundColor, backgroundHoverColor, color;
  switch (priority) {
    case "primary":
      backgroundColor = colors[theme][palette.primary](9);
      backgroundHoverColor = colors[theme][palette.primary](10);
      color = "white";
      break;
    case "danger":
      backgroundColor = colors[theme][palette.danger](9);
      backgroundHoverColor = colors[theme][palette.danger](10);
      color = "white";
      break;
    default:
      backgroundColor = colors[theme][palette.base](3);
      backgroundHoverColor = colors[theme][palette.base](4);
      color = colors.foreground.secondary();
      break;
  }
  return baseComponents.button({
    minWidth: "6rem",
    height: "2.5rem",
    flexGrow: smallViewportGrow && smallViewport ? 1 : 0,
    flexBasis: smallViewportGrow && smallViewport ? 0 : undefined,
    padding: "0 0.75rem",
    backgroundColor,
    backgroundHoverColor,
    color,
    disabled,
    href,
    onclick,
    child: {
      ...layouts.row("center", "center", "0.5rem"),
      children: [
        ligature
          ? icon({
              fontSize: "1.25rem",
              ligature,
            })
          : null,
        text
          ? {
              fontWeight: 600,
              whiteSpace: "nowrap",
              text,
            }
          : null,
      ],
    },
  });
}
