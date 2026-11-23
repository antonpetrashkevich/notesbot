import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";

export function icon({ fontSize, color, ligature } = {}) {
  return {
    classes: ["material-symbols-outlined"],
    fontSize,
    color,
    ...styles.unselectable(),
    text: ligature,
  };
}
