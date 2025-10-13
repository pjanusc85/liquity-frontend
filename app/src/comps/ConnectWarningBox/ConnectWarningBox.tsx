import { css } from "@/styled-system/css";
import { TextButton } from "@liquity2/uikit";
import { ConnectKitButton } from "connectkit";

export function ConnectWarningBox() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show }) =>
        !isConnected && (
          <div
            className={css({
              paddingTop: 16,
            })}
          >
            <div
              className={css({
                padding: "20px 24px",
                textAlign: "center",
                background: "secondary",
                borderRadius: 8,
              })}
            >
              Please{" "}
              <TextButton
                label="connect"
                onClick={show}
              />{" "}
              your wallet to continue.
            </div>
          </div>
        )
      }
    </ConnectKitButton.Custom>
  );
}
