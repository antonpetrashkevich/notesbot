import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { icon } from "../glyphs/icon";

export function prompt({ priority, ligature, title, description, note, buttons } = {}) {
  return baseComponents.modalCloseBackground({
    ...styles.modalCloseBackground(),
    child: {
      ...styles.modal(),
      ...layouts.column("start", "start", "1rem"),
      children: [
        {
          ...layouts.row("start", "center", "0.5rem"),
          children: [
            ligature
              ? icon({
                  fontSize: "1.25rem",
                  color: colors[theme][palette[priority || "base"]](9),
                  ligature,
                })
              : null,
            {
              fontWeight: 600,
              text: title,
            },
          ],
        },
        {
          text: description,
        },
        note
          ? {
              color: colors.foreground.secondary(),
              fontStyle: "italic",
              text: note,
            }
          : null,
        buttons
          ? {
              width: "100%",
              ...layouts.row("end", "center", "1rem"),
              children: buttons,
            }
          : null,
      ],
    },
  });
}
