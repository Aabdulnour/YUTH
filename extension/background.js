chrome.runtime.onInstalled.addListener(() => {
  console.log("MapleMind extension installed");
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
