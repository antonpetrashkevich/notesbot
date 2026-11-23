import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { icon } from "../glyphs/icon";

export function menu({ priority, size = "m", wrap = false, borderRadius = "0.5rem", fontWeight = 400, disabled, href, onclick, oncontextmenu, justifyContent = "center", ligature, text, buttons } = {}) {
  let padding, gap, fontSize, buttonBorderRadius;
  switch (size) {
    case "s":
      padding = "0.25rem";
      gap = "0.25rem";
      fontSize = "0.875rem";
      buttonBorderRadius = "0.25rem";
      break;
    case "m":
      padding = "0.375rem";
      gap = "0.375rem";
      fontSize = "1rem";
      buttonBorderRadius = "0.375rem";
      break;
    case "l":
      padding = "0.5rem";
      gap = "0.5rem";
      fontSize = "1.125rem";
      buttonBorderRadius = "0.5rem";
      break;
  }
  let backgroundHoverColor, iconColor, color, buttonColor, buttonBackgroundHoverColor;
  switch (priority) {
    case "danger":
      backgroundHoverColor = colors[theme][palette.danger](2);
      iconColor = colors[theme][palette.danger](10);
      color = colors.foreground.danger();
      buttonColor = colors[theme][palette.danger](10);
      buttonBackgroundHoverColor = colors[theme][palette.danger](4);
      break;
    default:
      backgroundHoverColor = colors[theme][palette.base](2);
      iconColor = colors.foreground.secondary();
      color = colors.foreground.primary();
      buttonColor = colors.foreground.secondary();
      buttonBackgroundHoverColor = colors[theme][palette.base](4);
      break;
  }
  return baseComponents.button({
    width: "100%",
    padding: "0.25rem",
    borderRadius,
    backgroundHoverColor,
    disabled,
    href,
    onclick,
    oncontextmenu,
    child: {
      width: "100%",
      ...layouts.row(justifyContent, "center", gap),
      children: [
        ligature
          ? icon({
              fontSize,
              padding,
              color: iconColor,
              ligature,
            })
          : null,
        text
          ? {
              minWidth: wrap ? undefined : 0,
              padding,
              fontSize,
              fontWeight,
              whiteSpace: wrap ? undefined : "nowrap",
              overflow: wrap ? undefined : "hidden",
              textOverflow: wrap ? undefined : "ellipsis",
              color,
              text,
            }
          : null,
        buttons
          ? {
              ...layouts.row("start", "center"),
              children: buttons.map((b) =>
                baseComponents.button({
                  padding,
                  borderRadius: buttonBorderRadius,
                  backgroundHoverColor: buttonBackgroundHoverColor,
                  color: buttonColor,
                  href: b.href,
                  child: icon({
                    fontSize,
                    ligature: b.ligature,
                  }),
                  onclick: b.onclick,
                })
              ),
            }
          : null,
      ],
    },
  });
}
