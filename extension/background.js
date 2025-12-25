// bg.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "capture-image",
        title: "Capture Image",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "capture-image" && info.srcUrl) {
        await chrome.tabs.sendMessage(tab.id, { ref: "analyzing" })
        sendImageFromSrc(info.srcUrl).then(async result => {
            await chrome.tabs.sendMessage(tab.id, { ref: "ai_response", data: result })

        })
    }
});


async function sendImageFromSrc(src) {
    const res = await fetch(src);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append("image", blob, "image.jpg");

    return await fetch("http://localhost:3000/api/detect-ai-image", {
        method: "POST",
        body: formData,
    }).then(rs => rs.json());
}