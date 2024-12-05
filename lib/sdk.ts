import { PAY_WITH_SIMPLE_SVG } from "./constants";
import { removeEmptyValues } from "./utils";

let simpleConfig: SimpleConfig;

window.setupSimple = function (
  { platformId, organizationId, amount, schedule },
  onTxnSuccess,
  onTxnError,
) {
  if (!platformId || typeof platformId !== "string") {
    console.error(
      "setupSimpleAccount: Invalid platformId. Please provide a valid string.",
    );
    return;
  }

  if (!organizationId || typeof organizationId !== "string") {
    console.error(
      "setupSimpleAccount: Invalid organizationId. Please provide a valid string.",
    );
    return;
  }

  if (!amount || typeof amount !== "string") {
    console.error(
      "setupSimpleAccount: Invalid amount. Please provide a valid string.",
    );
    return;
  }

  if (schedule && (!schedule.intervalType || !schedule.intervalCount)) {
    console.error(
      "setupSimpleAccount: Invalid schedule. Please provide a valid schedule.",
    );
    return;
  }

  simpleConfig = { platformId, organizationId, amount, schedule };

  console.info(
    "setupSimpleAccount: Configuration successfully set.",
    simpleConfig,
  );

  function handleMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) {
      console.warn("Origin mismatch:", event.origin);
      return;
    }

    if (event.data.type === "success") {
      onTxnSuccess(event.data);
    } else if (event.data.type === "error") {
      onTxnError(event.data);
    }
  }

  window.addEventListener("message", handleMessage);
};

export function initializeSDK() {
  console.info("initializeSDK");

  const emailInputs = document.querySelectorAll(
    "input[data-simple]",
  ) as NodeListOf<HTMLInputElement>;

  emailInputs.forEach((input) => {
    if (input.dataset.simpleIconAdded) return;

    const wrapper = document.createElement("div");

    wrapper.style.position = "relative";
    wrapper.style.display = "inherit";
    wrapper.style.width = "100%";

    input.parentNode?.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    input.style.paddingRight = "40px";

    const icon = document.createElement("div");
    icon.innerHTML = PAY_WITH_SIMPLE_SVG;
    icon.style.position = "absolute";
    icon.style.right = "10px";
    icon.style.top = "50%";
    icon.style.transform = "translateY(-50%)";
    icon.style.cursor = "pointer";
    icon.title = "Pay with Simple";

    wrapper.appendChild(icon);
    console.log("Simple icon added");

    input.dataset.simpleIconAdded = "true";

    icon.addEventListener("click", () => {
      const width = 500;
      const height = 600;

      const left = (window.screen.width - width) / 2 + window.screenLeft;
      const top = (window.screen.height - height) / 2;

      const params = {
        platformId: simpleConfig.platformId,
        organizationId: simpleConfig.organizationId,
        amount: simpleConfig.amount,
        ...simpleConfig.schedule,
      };

      window.open(
        `/payment?${new URLSearchParams(removeEmptyValues(params)).toString()}`,
        "PopupWindow",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
    });
  });
}
