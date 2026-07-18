"use client";

import { useState } from "react";

const command = "npx skills add ShaoXiangChien/roomfile";

export function CopyCommand() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const succeeded = document.execCommand("copy");
      textarea.remove();
      setCopied(succeeded);
    }
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="install-box">
      <span aria-hidden="true">$</span>
      <code>{command}</code>
      <button type="button" onClick={copy} aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
