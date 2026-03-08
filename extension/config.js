(function initializeMapleMindExtensionConfig() {
  const config = {
    apiBaseUrl: "http://localhost:3000",
    dashboardUrl: "http://localhost:3000/dashboard",
    previewMode: true,
    supportedMerchants: ["amazon", "bestbuy", "sephora"],
  };

  globalThis.MAPLEMIND_EXTENSION_CONFIG = config;
})();
