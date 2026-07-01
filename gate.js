/* ===========================================================================
   ContractorAI — Password Gate
   Light access control for early/demo use. NOT real security —
   the password lives client-side. Real auth comes with Supabase login later.
   Include this as the FIRST script in <head> on every page.
   =========================================================================== */
(function () {
  // ── CONFIG ────────────────────────────────────────────────────────────────
  var PASSWORD   = 'BuildNJ2026';            // change this to whatever you want
  var SESSION_KEY = 'contractorai_access';   // remembers unlock for the session
  var UNLOCK_HOURS = 12;                      // how long an unlock lasts

  // Already unlocked this session?
  try {
    var saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved && saved.until && Date.now() < saved.until) return; // let page load
  } catch (e) {}

  // ── Build the lock screen ──────────────────────────────────────────────────
  function showGate() {
    // Hide the page behind the gate
    var style = document.createElement('style');
    style.textContent = `
      #cai-gate{position:fixed;inset:0;z-index:999999;background:#0B1B3A;
        background-image:linear-gradient(rgba(11,27,58,.95),rgba(11,27,58,.95)),
          linear-gradient(#2563EB 1px,transparent 1px),
          linear-gradient(90deg,#2563EB 1px,transparent 1px);
        background-size:auto,26px 26px,26px 26px;
        display:flex;align-items:center;justify-content:center;padding:24px;
        font-family:'DM Sans',system-ui,sans-serif}
      #cai-gate .box{background:#fff;border-radius:16px;max-width:360px;width:100%;
        padding:32px 26px;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center}
      #cai-gate .logo{font-family:'Archivo',system-ui,sans-serif;font-weight:800;
        font-size:24px;color:#1E40AF;margin-bottom:6px;letter-spacing:.3px}
      #cai-gate .logo span{color:#94A3B8}
      #cai-gate .sub{font-size:13px;color:#64748B;margin-bottom:22px;line-height:1.5}
      #cai-gate input{width:100%;font-family:inherit;font-size:16px;padding:12px 14px;
        border:1.5px solid #E2E8F0;border-radius:9px;text-align:center;outline:none;
        color:#0F172A;margin-bottom:12px;letter-spacing:1px}
      #cai-gate input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
      #cai-gate button{width:100%;font-family:inherit;font-size:15px;font-weight:600;
        padding:12px;border:none;border-radius:9px;background:#2563EB;color:#fff;
        cursor:pointer;transition:background .15s}
      #cai-gate button:active{background:#1E40AF}
      #cai-gate .err{font-size:12px;color:#DC2626;margin-top:10px;min-height:16px;font-weight:500}
      #cai-gate .foot{font-size:11px;color:#94A3B8;margin-top:18px}
    `;
    document.head.appendChild(style);

    var gate = document.createElement('div');
    gate.id = 'cai-gate';
    gate.innerHTML = `
      <div class="box">
        <div class="logo">Contractor<span>AI</span></div>
        <div class="sub">This tool is private. Enter your access code to continue.</div>
        <input id="cai-pass" type="password" placeholder="Access code" autocomplete="off" autofocus>
        <button id="cai-go">Unlock</button>
        <div class="err" id="cai-err"></div>
        <div class="foot">Authorized contractors only</div>
      </div>`;
    document.body.appendChild(gate);

    function attempt() {
      var val = document.getElementById('cai-pass').value;
      if (val === PASSWORD) {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ until: Date.now() + UNLOCK_HOURS * 3600 * 1000 }));
        } catch (e) {}
        gate.remove();
        style.remove();
      } else {
        document.getElementById('cai-err').textContent = 'Incorrect code — try again';
        document.getElementById('cai-pass').value = '';
        document.getElementById('cai-pass').focus();
      }
    }

    document.getElementById('cai-go').addEventListener('click', attempt);
    document.getElementById('cai-pass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });
  }

  // Run as soon as body exists
  if (document.body) showGate();
  else document.addEventListener('DOMContentLoaded', showGate);
})();
