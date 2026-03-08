(function initializeMapleMindExtensionConfig() {
  const config = {
    apiBaseUrl: "https://yuthcanada.com",
    dashboardUrl: "https://yuthcanada.com/dashboard",
    previewMode: true,
    supportedMerchants: ["amazon", "bestbuy", "sephora"],
  };

  globalThis.MAPLEMIND_EXTENSION_CONFIG = config;
})();
