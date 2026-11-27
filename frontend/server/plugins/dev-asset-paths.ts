const windowsDevAssetPath =
  /\/_nuxt\/[A-Za-z]:\/(?:[^"'\\\s]+\/)*?frontend\//g;

function fixWindowsDevAssetPaths(value: string): string {
  return value.replace(windowsDevAssetPath, "/_nuxt/");
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html) => {
    const parts = ["head", "bodyPrepend", "body", "bodyAppend"] as const;
    for (const part of parts) {
      html[part] = html[part].map((chunk) =>
        typeof chunk === "string" ? fixWindowsDevAssetPaths(chunk) : chunk,
      );
    }
  });
});
