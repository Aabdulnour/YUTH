function extractProductData() {

  const title =
    document.querySelector("#productTitle")?.innerText ||
    document.title;

  const priceText =
    document.querySelector(".a-price .a-offscreen")?.innerText;

  const price =
    priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

  return {
    title,
    price
  };
}

async function sendToBackend(data) {

  const response = await fetch("http://localhost:3000/api/extension/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      useDemoProfile: true,
      page: {
        url: window.location.href,
        hostname: window.location.hostname,
        merchant: "amazon",
        pageType: "product",
        title: data.title,
        price: data.price
      }
    })
  });

  const result = await response.json();

  chrome.storage.local.set({
    lastAnalysis: result.result,
    lastAnalysisError: null
  });
}

const productData = extractProductData();

if (productData.price) {
  sendToBackend(productData);
}