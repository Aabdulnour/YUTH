chrome.runtime.onInstalled.addListener(() => {
  console.log("MapleMind browser decision support extension installed (preview mode).");
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
