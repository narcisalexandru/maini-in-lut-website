const SPA_FORM = "data-js-submit";

function isSpaForm(value: EventTarget | null): value is HTMLFormElement {
  return value instanceof HTMLFormElement && value.hasAttribute(SPA_FORM);
}

export default defineNuxtPlugin(() => {
  const nativeSubmit = HTMLFormElement.prototype.submit;

  HTMLFormElement.prototype.submit = function submit(this: HTMLFormElement) {
    if (!this.hasAttribute(SPA_FORM)) {
      nativeSubmit.call(this);
      return;
    }

    if (typeof this.requestSubmit === "function") {
      try {
        this.requestSubmit();
        return;
      } catch {
        // Older WebKit builds throw when the form has no enabled submit button.
      }
    }

    this.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  };

  document.addEventListener(
    "submit",
    (event) => {
      if (isSpaForm(event.target)) {
        event.preventDefault();
      }
    },
    true,
  );
});
