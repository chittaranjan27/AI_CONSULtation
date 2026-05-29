(function () {
  "use strict";

  // Read config from script tag — must use document.currentScript or find by attributes
  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      var cid = s.getAttribute("data-chatbot-id");
      var m = s.getAttribute("data-mode") || "floating";
      var src = s.getAttribute("src") || "";
      if (cid && src.indexOf("widget.js") !== -1) {
        var testKey = "__BRAHMA_WIDGET_" + m.toUpperCase() + "__";
        if (!window[testKey]) {
          script = s;
          break;
        }
      }
    }
  }
  // Fallback to last script tag if still not found
  if (!script) {
    var scripts = document.getElementsByTagName("script");
    script = scripts[scripts.length - 1];
  }

  var chatbotId = script.getAttribute("data-chatbot-id");
  if (!chatbotId) {
    console.error("[AIConsultation Widget] Missing data-chatbot-id attribute");
    return;
  }

  var baseUrl = script.getAttribute("data-base-url") || script.src.replace(/\/widget\.js.*$/, "");
  var position = script.getAttribute("data-position") || "bottom-right";
  var mode = script.getAttribute("data-mode") || "floating";

  // Prevent double init per mode
  var initKey = "__BRAHMA_WIDGET_" + mode.toUpperCase() + "__";
  if (window[initKey]) return;
  window[initKey] = true;

  // For inline mode, save a reference to the script's parent and next sibling
  // BEFORE any async operations, because document.currentScript becomes null later
  var inlineParent = script.parentNode;
  var inlineNextSibling = script.nextSibling;

  // Inject styles
  var style = document.createElement("style");
  style.textContent = [
    "/* Floating button */",
    ".bg-widget-btn{",
    "  position:fixed;width:56px;height:56px;border-radius:50%;",
    "  background:linear-gradient(135deg,#8b5cf6,#3b82f6,#06b6d4);",
    "  border:none;cursor:pointer;z-index:999998;",
    "  display:flex;align-items:center;justify-content:center;",
    "  box-shadow:0 4px 24px rgba(139,92,246,0.4);",
    "  transition:transform 0.3s ease,box-shadow 0.3s ease;",
    "}",
    ".bg-widget-btn:hover{transform:scale(1.1);box-shadow:0 6px 32px rgba(139,92,246,0.5);}",
    ".bg-widget-btn svg{width:26px;height:26px;fill:white;}",
    ".bg-widget-btn.bg-pos-bottom-right{bottom:24px;right:24px;}",
    ".bg-widget-btn.bg-pos-bottom-left{bottom:24px;left:24px;}",
    ".bg-widget-btn.bg-pos-top-right{top:24px;right:24px;}",
    ".bg-widget-btn.bg-pos-top-left{top:24px;left:24px;}",
    ".bg-widget-pulse{",
    "  position:absolute;inset:-4px;border-radius:50%;",
    "  border:2px solid rgba(139,92,246,0.4);",
    "  animation:bg-pulse 2s ease-out infinite;",
    "}",
    "@keyframes bg-pulse{",
    "  0%{transform:scale(0.95);opacity:0.7;}",
    "  50%{transform:scale(1.1);opacity:0.3;}",
    "  100%{transform:scale(1.2);opacity:0;}",
    "}",
    "/* Floating frame */",
    ".bg-widget-frame{",
    "  position:fixed;z-index:999999;",
    "  border:none;border-radius:16px;",
    "  box-shadow:0 8px 48px rgba(0,0,0,0.35),0 0 60px rgba(99,102,241,0.12);",
    "  width:400px;height:600px;max-height:80vh;",
    "  opacity:0;transform:translateY(20px) scale(0.95);",
    "  transition:opacity 0.3s ease,transform 0.3s ease;",
    "  pointer-events:none;",
    "}",
    ".bg-widget-frame.bg-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
    ".bg-widget-frame.bg-pos-bottom-right{bottom:90px;right:24px;}",
    ".bg-widget-frame.bg-pos-bottom-left{bottom:90px;left:24px;}",
    ".bg-widget-frame.bg-pos-top-right{top:90px;right:24px;}",
    ".bg-widget-frame.bg-pos-top-left{top:90px;left:24px;}",
    "/* Inline widget */",
    ".bg-widget-inline-wrap{",
    "  display:block;width:100%;max-width:1000px;margin:0 auto;",
    "  min-height:600px;box-sizing:border-box;clear:both;",
    "}",
    ".bg-widget-inline-wrap iframe{",
    "  display:block;width:100%;height:600px;",
    "  border:1px solid rgba(99,130,202,0.18);border-radius:16px;",
    "  box-shadow:0 4px 24px rgba(0,0,0,0.3),0 0 40px rgba(99,102,241,0.08);",
    "  overflow:hidden;background:#0b1023;",
    "}",
    "/* Responsive */",
    "@media(max-width:640px){",
    "  .bg-widget-frame{",
    "    width:100vw!important;height:100vh!important;max-height:100vh!important;",
    "    top:0!important;left:0!important;right:0!important;bottom:0!important;",
    "    border-radius:0!important;",
    "  }",
    "  .bg-widget-btn.bg-open-mobile{display:none!important;}",
    "  .bg-widget-inline-wrap{min-height:500px!important;}",
    "  .bg-widget-inline-wrap iframe{height:500px!important;border-radius:12px;}",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  // Build iframe URL
  var iframeSrc = baseUrl + "/embed/" + chatbotId + "?mode=" + mode;

  if (mode === "inline") {
    // ===== INLINE MODE =====
    // Create container + iframe
    var wrap = document.createElement("div");
    wrap.className = "bg-widget-inline-wrap";

    var inlineFrame = document.createElement("iframe");
    inlineFrame.src = iframeSrc;
    inlineFrame.setAttribute("title", "AI Chat Assistant");
    inlineFrame.setAttribute("allow", "microphone; clipboard-write");
    inlineFrame.setAttribute("frameborder", "0");
    wrap.appendChild(inlineFrame);

    // Insert into the DOM — use the saved references safely
    var isParentInBody = inlineParent && inlineParent.tagName !== "HEAD" && inlineParent !== document.documentElement;

    if (isParentInBody) {
      inlineParent.insertBefore(wrap, inlineNextSibling);
    } else {
      var insertIntoBody = function () {
        if (document.body) {
          document.body.appendChild(wrap);
        }
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", insertIntoBody);
      } else {
        insertIntoBody();
      }
    }

  } else {
    // ===== FLOATING MODE =====
    var iframe = document.createElement("iframe");
    iframe.className = "bg-widget-frame bg-pos-" + position;
    iframe.src = iframeSrc;
    iframe.setAttribute("title", "AI Chat Assistant");
    iframe.setAttribute("allow", "microphone; clipboard-write");

    var btn = document.createElement("button");
    btn.className = "bg-widget-btn bg-pos-" + position;
    btn.setAttribute("aria-label", "Open chat");
    btn.innerHTML = [
      '<div class="bg-widget-pulse"></div>',
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>',
      '<path d="M7 9h10v2H7zm0-3h10v2H7z"/>',
      '</svg>',
    ].join("");

    var isOpen = false;
    function toggle() {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.classList.add("bg-open");
        btn.classList.add("bg-open-mobile");
        btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      } else {
        iframe.classList.remove("bg-open");
        btn.classList.remove("bg-open-mobile");
        btn.innerHTML = [
          '<div class="bg-widget-pulse"></div>',
          '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
          '<path fill="white" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>',
          '<path fill="white" d="M7 9h10v2H7zm0-3h10v2H7z"/>',
          '</svg>',
        ].join("");
      }
    }

    btn.addEventListener("click", toggle);
    window.addEventListener("message", function (e) {
      if (e.data === "bg-widget-close" && isOpen) {
        toggle();
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(iframe);
  }
})();
