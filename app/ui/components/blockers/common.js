import { theme } from "xpl_kit";
import { colors } from "../../colors/colors";
import { palette } from "../../colors/palette";
import { styles } from "../../styles/styles";
import { layouts } from "../../layouts/layouts";
import { handlers } from "../../handlers/handlers";
import { components as baseComponents } from "xpl_kit";
import { spinner } from "../glyphs/spinner";

export function common({ errorRuntime, errorRuntimeText = "Something went wrong. Restart the app.", errorNetwork, errorNetworkText = "Network error. Check your connection and try again.", errorAccessDenied, errorAccessDeniedText = "Access denied. You don’t have permission to access this page.", errorNotFound, errorNotFoundText = "Not found. Invalid URL.", errorOutOfSync, errorOutOfSyncText = "Out of sync. Restart the app.", loading, loadingText } = {}) {
  {
    let error;
    let errorText;
    if (errorRuntime) {
      error = errorRuntime;
      errorText = errorRuntimeText;
    } else if (errorNetwork) {
      error = errorNetwork;
      errorText = errorNetworkText;
    } else if (errorAccessDenied) {
      error = errorAccessDenied;
      errorText = errorAccessDeniedText;
    } else if (errorNotFound) {
      error = errorNotFound;
      errorText = errorNotFoundText;
    } else if (errorOutOfSync) {
      error = errorOutOfSync;
      errorText = errorOutOfSyncText;
    }

    return baseComponents.blocker({
      backgroundColor: colors.background.base(),
      toggled: loading || error,
      child: {
        width: "100%",
        height: "100%",
        padding: "1rem",
        ...layouts.column("center", "center", "2rem"),
        children: [
          loading && !error
            ? spinner({
                width: "8vh",
                height: "8vh",
                color: colors[theme][palette.base](4),
              })
            : null,
          loading && loadingText && !error
            ? {
                text: loadingText,
              }
            : error
            ? {
                text: errorText,
              }
            : null,
        ],
      },
    });
  }
}
