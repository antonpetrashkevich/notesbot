import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";

export function text({ width = "100%", minWidth, maxWidth, height, minHeight, maxHeight, flexBasis, flexShrink = 0, flexGrow, padding = "0.5rem", border = `1px solid ${colors[theme][palette.base](7)}`, borderRadius = "0.5rem", backgroundColor = "inherit", fontSize = "1rem", lineHeight = 1.5, color = "inherit", password = false, disabled, maxlength, placeholder, value, oninput } = {}) {
  return {
    tag: "input",
    width,
    minWidth,
    maxWidth,
    height,
    minHeight,
    maxHeight,
    flexBasis,
    flexShrink,
    flexGrow,
    padding,
    border,
    borderRadius,
    backgroundColor,
    fontFamily: "inherit",
    fontSize,
    lineHeight,
    color,
    appearance: "none",
    ...(disabled ? styles.disabled() : {}),
    type: password ? "password" : "text",
    disabled,
    maxlength,
    placeholder,
    value,
    onfocus: function () {
      this.domElement.style.outline = "none";
    },
    oninput,
  };
}
