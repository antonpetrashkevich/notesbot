import { handlers as baseHandlers } from "xpl_kit";
import { handlers as albaHandlers } from "alba";

export const handlers = {
	...baseHandlers,
  ...albaHandlers
};
