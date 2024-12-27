import { BASE_URL, PAY_WITH_SIMPLE_SVG } from "./constants";
import { createRenewableAbortController, removeEmptyValues } from "./utils";
import { validateConfig } from "./validator";

const state = {
  config: {} as Partial<SimpleConfig>,
  autoOpenTimeout: undefined as Timer | undefined,
  popup: null as Window | null,
  abortControllers: {
    emailListener: createRenewableAbortController(),
    emailCheck: createRenewableAbortController(),
  },
  emailValidation: {
    lastResult: {
      email: "",
      isValid: false,
    },
  },
};

// Event listener for postMessage
window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin === BASE_URL && event.data.type === "success") {
    state.config.onSuccess?.(event.data);
  }
});

// Main configuration function
window.applySimpleConfig = function (config) {
  if (config) {
    state.config = { ...state.config, ...config };
    validateConfig(state.config)
      .then((errors) => applySimple(!errors?.length))
      .catch((error) => {
        console.error("Failed to validate config:", error);
        applySimple(false);
      });
  } else {
    console.debug("Simple config: Clearing all config...");
    state.config = {};
    applySimple(false);
  }
  console.debug("Simple config:", state.config);
};

function openPaymentPopup() {
  const width = 500;
  const height = 600;
  const left = (window.screen.width - width) / 2 + window.screenLeft;
  const top = (window.screen.height - height) / 2;

  const params = {
    platformId: state.config.platformId,
    organizationTaxId: state.config.organizationTaxId,
    amount: state.config.amount,
    email: state.config.email,
    ...state.config.schedule,
  };

  state.popup = window.open(
    `${BASE_URL}/payment?${new URLSearchParams(removeEmptyValues(params)).toString()}`,
    "PopupWindow",
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

function addSimpleIcon(input: HTMLInputElement) {
  console.debug("Injecting Simple icon");

  // Get computed styles from input
  // need to rewrite from original do to bu with assigning letter from original computedStyle
  const computedStyle = { ...window.getComputedStyle(input) };

  const inputStyles: Record<string, string> = {
    // Remove margins from input
    margin: "0px",
    // Add padding to the right of the input to make space for the icon
    // "padding-right": '40px',
  };

  // Check and set box-sizing to border-box if not already set
  if (computedStyle.boxSizing !== "border-box") {
    inputStyles["box-sizing"] = "border-box";

    const rect = input.getBoundingClientRect();

    // Compensate for the change in box-sizing
    inputStyles.width = `${rect.width}px`;
    inputStyles.height = `${rect.height}px`;
  }

  // generate random id which can also be used as class name
  const inputStyleClassName = `simple-input-${Math.random().toString(36).substring(2, 15)}`;

  // create a style class in document of the input styles object
  const style = document.createElement("style");
  style.textContent = `.${inputStyleClassName} {
    ${Object.entries(inputStyles)
      .map(([key, value]) => `${key}: ${value} !important;`)
      .join("\n")}
  }`;
  document.head.appendChild(style);
  input.classList.add(inputStyleClassName);

  const wrapper = document.createElement("div");
  wrapper.classList.add("simple-wrapper");
  wrapper.style.cssText = `
    position: relative;
    display: inherit;
    width: 100%;
    margin: ${computedStyle.marginTop} ${computedStyle.marginRight} ${computedStyle.marginBottom} ${computedStyle.marginLeft};
  `;

  input.parentNode?.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const icon = document.createElement("div");
  icon.innerHTML = PAY_WITH_SIMPLE_SVG;
  icon.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.5s ease;
  `;
  icon.title = "Pay with Simple";
  wrapper.appendChild(icon);

  // Trigger reflow and fade in the icon
  setTimeout(() => (icon.style.opacity = "1"), 0);

  icon.addEventListener("click", openPaymentPopup);
  input.addEventListener(
    "input",
    () => window.applySimpleConfig({ email: input.value }),
    { signal: state.abortControllers.emailListener.signal },
  );

  input.dataset.simpleIconAdded = "true";
  console.debug("Simple icon added");
}

function removeSimpleIcon(input: HTMLInputElement) {
  console.debug("Removing Simple icon");
  const wrapper = input.parentElement;
  if (wrapper?.classList.contains("simple-wrapper")) {
    const icon: HTMLDivElement | null = wrapper.querySelector("div:last-child");
    // Fade out the icon
    if (icon) icon.style.opacity = "0";

    setTimeout(() => {
      // Move the input back to its original position
      wrapper.parentNode?.insertBefore(input, wrapper);
      // Remove the wrapper (which also removes the icon)
      wrapper.remove();
      // Remove the style class from the input
      input.className = input.className.replace(/simple-input-\w+/, "");
    }, 500);
  }
}

// Helper function to validate email and open popup
async function checkEmailAndOpenPopup() {
  const { email } = state.config;
  const { lastResult } = state.emailValidation;

  // If no email or popup is open, do nothing
  if (!email || (state.popup && !state.popup.closed)) return;

  // Validate email format
  if (
    !email?.match(
      /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
    )
  )
    return;

  // Use cached result if available
  if (lastResult.email === email) {
    if (lastResult.isValid) {
      console.debug("Using cached email validation result");
      openPaymentPopup();
    }
    return;
  }

  // If not cached, check if email is registered
  try {
    console.debug("Checking if email is registered:", email);
    const response = await fetch(
      `${BASE_URL}/api/popup/check-email?platformId=${state.config.platformId}&email=${email}`,
      { signal: state.abortControllers.emailCheck.signal },
    );

    if (response.ok) {
      const { isRegistered } = await response.json();
      lastResult.email = email;
      lastResult.isValid = isRegistered;

      if (isRegistered) {
        console.debug("Email is registered, opening popup");
        openPaymentPopup();
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Failed to validate email:", error);
    }
  }
}

function applySimple(apply: boolean) {
  clearTimeout(state.autoOpenTimeout);
  state.abortControllers.emailCheck.renew();
  if (apply) state.autoOpenTimeout = setTimeout(checkEmailAndOpenPopup, 1000);
  else state.abortControllers.emailListener.renew();

  // Find and process all email inputs
  let emailInputs = document.querySelectorAll(
    ".simple-email input, input.simple-email",
  ) as NodeListOf<HTMLInputElement>;
  if (!emailInputs.length)
    emailInputs = document.querySelectorAll(
      "input[type='email']",
    ) as NodeListOf<HTMLInputElement>;

  emailInputs.forEach((input) => {
    if (input.className.includes("simple-input") === apply) return;

    if (apply) addSimpleIcon(input);
    else removeSimpleIcon(input);
  });
}
