import { theme } from "xpl_kit";
import { colors } from "../colors/colors";
import { palette } from "../colors/palette";

export function lineClamp(lines = 2) {
  return {
    display: "-webkit-box",
    webkitLineClamp: lines,
    webkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}
