// bg.js
const API_ROUTE = "https://api.ai-detect.io"
// const API_ROUTE = 'http://localhost:8000';
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "capture-image",
    title: "ai-detector",
    contexts: ["image", "video"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "capture-image" && info.srcUrl) {
    await chrome.tabs.sendMessage(tab.id, { ref: "analyzing" })
    try {
      let result = await sendImageFromSrc(info.srcUrl)
      await chrome.tabs.sendMessage(tab.id, { ref: "ai_response", data: result, src: info.srcUrl })
    } catch (error) {
      await chrome.tabs.sendMessage(tab.id, { ref: "ai_response_error", message: error.message || "Error!, Please try with another!" })
    }
  }
})

function reloadAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) chrome.tabs.reload(tab.id)
    }
  })
}

chrome.runtime.onInstalled.addListener(reloadAllTabs)

async function sendImageFromSrc(src) {
  const res = await fetch(src)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append("image", blob, "image.jpg")
  try {
    let res = await fetch(`${API_ROUTE}/detect-ai-image`, {
      method: "POST",
      body: formData,
    })
    res = await res.json()
    if (res.error) {
      throw new Error(res.error)
    }
    return res
  } catch (error) {
    throw new Error("Error!, Please try with another!")
  }
}
