import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { icon } from "../glyphs/icon";


export function floating({ priority, disabled, onclick, ligature } = {}) {
  let backgroundColor, backgroundHoverColor, color;
  switch (priority) {
    case "primary":
      backgroundColor = colors[theme][palette.primary](3);
      backgroundHoverColor = colors[theme][palette.primary](4);
      color = colors[theme][palette.primary](11);
      break;
    case "danger":
      backgroundColor = colors[theme][palette.danger](3);
      backgroundHoverColor = colors[theme][palette.danger](4);
      color = colors[theme][palette.danger](11);
      break;
    default:
      backgroundColor = colors[theme][palette.base](3);
      backgroundHoverColor = colors[theme][palette.base](4);
      color = colors.foreground.secondary();
      break;
  }
  return baseComponents.button({
    width: "3rem",
    height: "3rem",
    padding: "0.5rem",
    borderRadius: "2rem",
    backgroundColor,
    backgroundHoverColor,
    color,
    disabled,
    onclick,
    child: icon({
      fontSize: "2rem",
      ligature,
    }),
  });
}
