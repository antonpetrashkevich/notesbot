import { components as baseComponents } from "xpl_kit";
import { common } from "./blockers/common";
import { floating } from "./buttons/floating";
import { form } from "./buttons/form";
import { menu as buttonMenu } from "./buttons/menu";
import { icon } from "./glyphs/icon";
import { spinner } from "./glyphs/spinner";
import { image } from "./inputs/image";
import { text } from "./inputs/text";
import { textArea } from "./inputs/textArea";
import { toggle } from "./inputs/toggle";
import { menu as modalMenu } from "./modals/menu";
import { prompt } from "./modals/prompt";
import { header } from "./shell/header";

export const components = {
  ...baseComponents,
  blockers: {
    common,
  },
  buttons: {
    floating,
    form,
    menu: buttonMenu,
  },
  glyphs: {
    icon,
    spinner,
  },
  inputs: {
    image,
    text,
    textArea,
    toggle,
  },
  modals: {
    menu: modalMenu,
    prompt,
  },
  shell: {
    header,
  },
};
