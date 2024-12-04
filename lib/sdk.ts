import { PAY_WITH_SIMPLE_SVG } from "./constants";

type SimpleAccountConfig = {
  platformId: string;
  organizationId: string;
  amount: string;
};

let simpleAccountConfig: SimpleAccountConfig;

/**
 * Global function to set up account configuration.
 * @param {string} platformId - The platform ID for the client.
 * @param {string} organizationId - The organization ID for the client.
 */
window.setupSimpleAccount = function (
  platformId: string,
  organizationId: string,
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

  simpleAccountConfig = { platformId, organizationId, amount: "1" };
  console.info(
    "setupSimpleAccount: Configuration successfully set.",
    simpleAccountConfig,
  );
};

export function initializeSDK() {
  console.info("initializeSDK");

  const emailInputs = document.querySelectorAll(
    "input[type='email']",
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
    input.dataset.simpleIconAdded = "true";

    icon.addEventListener("click", () => {
      const width = 500;
      const height = 600;

      const left = (window.screen.width - width) / 2 + window.screenLeft;
      const top = (window.screen.height - height) / 2;

      window.open(
        `/payment?${new URLSearchParams(simpleAccountConfig).toString()}`,
        "PopupWindow",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
    });
  });
}
