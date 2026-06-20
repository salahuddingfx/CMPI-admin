// Custom Dialog System for CMPI Portal
// Implements highly premium, theme-matched modal alerts and confirmations.

declare global {
  interface Window {
    customConfirm: (message: string, title?: string) => Promise<boolean>;
  }
}

// Inject CSS animations dynamically
if (typeof document !== "undefined" && !document.getElementById("custom-dialog-styles")) {
  const style = document.createElement("style");
  style.id = "custom-dialog-styles";
  style.innerHTML = `
    @keyframes customFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes customScaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .custom-dialog-fade-in {
      animation: customFadeIn 0.2s ease-out forwards;
    }
    .custom-dialog-scale-up {
      animation: customScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `;
  document.head.appendChild(style);
}

export function showAlert(message: string, title = "Notification"): Promise<void> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm custom-dialog-fade-in";
    
    const card = document.createElement("div");
    card.className = "w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950 p-8 text-center shadow-2xl custom-dialog-scale-up mx-4";
    
    // Logo Icon
    const iconContainer = document.createElement("div");
    iconContainer.className = "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse";
    iconContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `;
    card.appendChild(iconContainer);

    const titleEl = document.createElement("h3");
    titleEl.className = "text-lg font-black text-white tracking-tight";
    titleEl.innerText = title;
    card.appendChild(titleEl);
    
    const msgEl = document.createElement("p");
    msgEl.className = "mt-3 text-sm text-slate-400 font-medium leading-relaxed";
    msgEl.innerText = message;
    card.appendChild(msgEl);
    
    const actions = document.createElement("div");
    actions.className = "mt-6";
    
    const okBtn = document.createElement("button");
    okBtn.className = "w-full rounded-2xl bg-primary hover:bg-primary/90 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all";
    okBtn.innerText = "Okay, Got it";
    okBtn.onclick = () => {
      document.body.removeChild(backdrop);
      resolve();
    };
    actions.appendChild(okBtn);
    
    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
  });
}

export function showConfirm(message: string, title = "Confirm Action"): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm custom-dialog-fade-in";
    
    const card = document.createElement("div");
    card.className = "w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950 p-8 text-center shadow-2xl custom-dialog-scale-up mx-4";
    
    // Alert Icon
    const iconContainer = document.createElement("div");
    iconContainer.className = "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15 text-secondary animate-bounce";
    iconContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
    card.appendChild(iconContainer);

    const titleEl = document.createElement("h3");
    titleEl.className = "text-lg font-black text-white tracking-tight";
    titleEl.innerText = title;
    card.appendChild(titleEl);
    
    const msgEl = document.createElement("p");
    msgEl.className = "mt-3 text-sm text-slate-400 font-medium leading-relaxed";
    msgEl.innerText = message;
    card.appendChild(msgEl);
    
    const actions = document.createElement("div");
    actions.className = "mt-6 flex gap-3";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "flex-1 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3.5 text-sm font-black text-white hover:scale-[1.02] active:scale-[0.98] transition-all";
    cancelBtn.innerText = "Cancel";
    cancelBtn.onclick = () => {
      document.body.removeChild(backdrop);
      resolve(false);
    };
    actions.appendChild(cancelBtn);
    
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "flex-1 rounded-2xl bg-secondary hover:bg-secondary/95 px-4 py-3.5 text-sm font-black text-primary shadow-lg shadow-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all";
    confirmBtn.innerText = "Yes, Proceed";
    confirmBtn.onclick = () => {
      document.body.removeChild(backdrop);
      resolve(true);
    };
    actions.appendChild(confirmBtn);
    
    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
  });
}

// Override global alert
if (typeof window !== "undefined") {
  window.alert = (message: string) => {
    showAlert(message);
  };
  window.customConfirm = showConfirm;
}
