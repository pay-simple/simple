import { PAY_WITH_SIMPLE_SVG } from "./constants";
import { getBaseUrl, removeEmptyValues } from "./utils";
import { validateConfig } from "./validator";

let simpleConfig: SimpleConfig;

window.setupSimple = function (config, onTxnSuccess, onTxnError) {
  const validationError = validateConfig(config);

  if (validationError) {
    console.error("setupSimpleAccount:", validationError);
    throw new Error(validationError);
  }

  simpleConfig = { ...simpleConfig, ...config };

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
    ".simple-input input, input.simple-input",
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
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
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
        `${getBaseUrl()}/payment?${new URLSearchParams(
          removeEmptyValues(params),
        ).toString()}`,
        "PopupWindow",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
    });
  });
}
