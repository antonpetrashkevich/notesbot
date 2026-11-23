import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { icon } from "../glyphs/icon";

export function image({ width, height, aspectRatio, borderRadius, backgroundColor = colors[theme][palette.base](3), color = colors.foreground.tertiary(), disabled, url, oninput } = {}) {
  return {
    ...styles.unselectable(),
    width,
    height,
    aspectRatio,
    borderRadius,
    cursor: "pointer",
    ...(disabled ? styles.disabled() : {}),
    children: [
      {
        tag: "input",
        display: "none",
        type: "file",
        accept: "image/*",
        onchange: function (event) {
          const file = event.target.files[0];
          const parent = this.parent;
          if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
              oninput?.({ file, dataURL: e.target.result });
              url = e.target.result;
              parent.children[1].update();
            };
            reader.readAsDataURL(file);
          }
        },
      },
      () => ({
        width: "100%",
        height: "100%",
        children: [
          url
            ? {
                tag: "img",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                objectFit: "cover",
                src: url,
                onclick: disabled
                  ? undefined
                  : function (event) {
                      event.preventDefault();
                      event.stopPropagation();
                      this.parent.parent.children[0].domElement.click();
                    },
              }
            : {
                ...layouts.column("center", "center", "0.5rem"),
                width: "100%",
                height: "100%",
                padding: "0.5rem",
                backgroundColor: backgroundColor,
                onclick: disabled
                  ? undefined
                  : function (event) {
                      event.preventDefault();
                      event.stopPropagation();
                      this.parent.parent.children[0].domElement.click();
                    },
                children: [
                  icon({
                    fontSize: "1.5rem",
                    color,
                    ligature: "upload",
                  }),
                  {
                    fontWeight: 600,
                    color: color,
                    text: "Upload",
                  },
                ],
              },
          url
            ? {
                position: "absolute",
                top: 0,
                right: 0,
                transform: "translate(-25%, 25%)",
                ...layouts.row(),
                children: [
                  baseComponents.button({
                    padding: "0.125rem",
                    borderRadius: "1rem",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    backgroundHoverColor: "rgba(0,0,0,0.25)",
                    color: "rgba(0,0,0,0.65)",
                    hoverColor: "rgba(255,255,255,0.85)",
                    onclick: disabled
                      ? undefined
                      : function (event) {
                          event.preventDefault();
                          event.stopPropagation();
                          oninput?.({ file: null, dataURL: null });
                          url = null;
                          this.parent.parent.update();
                        },
                    child: icon({
                      // color: 'inherit',
                      ligature: "close",
                    }),
                  }),
                ],
              }
            : null,
        ],
      }),
    ],
  };
}
