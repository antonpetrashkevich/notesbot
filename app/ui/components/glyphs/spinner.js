import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";

export function spinner({ width, minWidth, maxWidth, height, minHeight, maxHeight, flexBasis, flexShrink = 0, flexGrow, padding, lineGap = 0.25, lineWidth = 10, lineCap, color, speed = 0.75 } = {}) {
  let r = Math.floor(50 - lineWidth / 2);
  return {
    html: `<svg viewBox="0 0 100 100" stroke="${color}" fill="none"><circle cx="50" cy="50" r="${r}" stroke-width="${lineWidth}" stroke-dasharray="${2 * Math.PI * r * (1 - lineGap)} ${2 * Math.PI * r * lineGap}" stroke-linecap=${lineCap}> <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="${speed}s" repeatCount="indefinite"/></circle></svg>`,
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
  };
}
