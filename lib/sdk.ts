import { PAY_WITH_SIMPLE_SVG } from "./constants";
import { getBaseUrl, removeEmptyValues } from "./utils";
import { validateConfig } from "./validator";

let simpleConfig: Partial<SimpleConfig> = {};

window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin !== window.location.origin) {
    console.warn("Origin mismatch:", event.origin);
    return;
  }

  if (event.data.type === "success") {
    simpleConfig.onSuccess?.(event.data);
  } else if (event.data.type === "error") {
    simpleConfig.onError?.(event.data);
  }
});

window.applySimpleConfig = function (config) {
  if (config) {
    simpleConfig = { ...simpleConfig, ...config };
    injectSimpleIcon(validateConfig(config)?.length === 0);
  } else {
    console.debug("Simple config: Clearing all config...");
    simpleConfig = {};
    injectSimpleIcon(false);
  }
  console.debug("Simple config:", simpleConfig);
};

function injectSimpleIcon(inject: boolean) {
  const emailInputs = document.querySelectorAll(
    ".simple-input input, input.simple-input",
  ) as NodeListOf<HTMLInputElement>;

  emailInputs.forEach((input) => {
    if (input.dataset.simpleIconAdded === inject.toString()) return;

    if (!inject) {
      console.info("Removing Simple icon");
      // Find the wrapper div (parent of the input)
      const wrapper = input.parentElement;
      if (wrapper && wrapper.classList.contains("simple-wrapper")) {
        const icon: HTMLDivElement | null =
          wrapper.querySelector("div:last-child");
        // Fade out the icon
        if (icon) icon.style.opacity = "0";
        setTimeout(() => {
          // Move the input back to its original position
          wrapper.parentNode?.insertBefore(input, wrapper);
          // Remove the wrapper (which also removes the icon)
          wrapper.remove();
        }, 500);
      }

      // Reset the input styles
      input.style.paddingRight = "";
      input.dataset.simpleIconAdded = "false";
      return;
    }

    console.info("Injecting Simple icon");

    const wrapper = document.createElement("div");
    wrapper.classList.add("simple-wrapper");

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
    icon.style.opacity = "0"; // Start with opacity 0
    icon.style.transition = "opacity 0.5s ease"; // Add transition
    icon.title = "Pay with Simple";

    wrapper.appendChild(icon);

    // Trigger reflow and fade in the icon
    setTimeout(() => {
      icon.style.opacity = "1";
    }, 0);

    console.info("Simple icon added");

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
