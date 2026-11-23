import { theme, colors } from "xpl_kit";
import { palette } from "./palette";

export const foreground = {
  primary: (alpha = false, forceRGB = false) => colors[theme][palette.base](12, alpha, forceRGB),
  secondary: (alpha = false, forceRGB = false) => colors[theme][palette.base](11, alpha, forceRGB),
  tertiary: (alpha = false, forceRGB = false) => colors[theme][palette.base](9, alpha, forceRGB),
  danger: (alpha = false, forceRGB = false) => colors[theme][palette.danger](11, alpha, forceRGB),
  textLink: (alpha = false, forceRGB = false) => colors[theme].blue(11, alpha, forceRGB),
};
