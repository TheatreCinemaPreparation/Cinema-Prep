// MULTI-LANGUAGE AND THEME

const langBtn  = document.getElementById("langBtn");
const themeBtn = document.getElementById("themeBtn");

let currentLang = localStorage.getItem("lang") || "hy";

// Reads data-lang-{lang} from each element and sets textContent.
// For inputs: reads data-lang-{lang}-placeholder and sets placeholder.
// For title element: sets document.title.
// For auth modal dynamic elements: reads data-mode-* attributes.
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  // Update all elements with data-lang-{lang} attribute
  document.querySelectorAll(`[data-lang-${lang}]`).forEach(el => {
    const val = el.getAttribute(`data-lang-${lang}`);
    if (val === null || val === "") return;
    if (el.tagName === "TITLE") {
      document.title = val;
    } else {
      el.textContent = val;
    }
  });

  // Update input placeholders

  document.querySelectorAll(`[data-lang-${lang}-placeholder]`).forEach(el => {
    el.placeholder = el.getAttribute(`data-lang-${lang}-placeholder`);
  });

  // Update auth modal mode-dependent texts (register/login)
  const mode = isLogin ? "login" : "register";
  updateAuthTexts(lang, mode);

  updateProfileTexts();
  updateAdminPanelTexts();
}

// Updates auth modal elements that vary by both language AND login/register mode
function updateAuthTexts(lang, mode) {
  // Forgot-password flow has its own title/submit texts per step; skip normal mode texts
  if (typeof forgotStep !== "undefined" && forgotStep) {
    updateForgotTexts();
    return;
  }

  ["authTitle", "authSubmit", "switchQuestion", "switchMode"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.getAttribute(`data-mode-${mode}-${lang}`);
    if (val !== null) el.textContent = val;
  });

  // OTP step overrides title and submit
  if (otpStep) {
    const otpTitles = { hy: "Հաստատեք Email-ը", en: "Confirm Email", ru: "Подтвердите Email" };
    const otpSubmits = { hy: "Հաստատել", en: "Confirm", ru: "Подтвердить" };
    const titleEl  = document.getElementById("authTitle");
    const submitEl = document.getElementById("authSubmit");
    const otpEl    = document.getElementById("otpInput");
    if (titleEl)  titleEl.textContent  = otpTitles[lang];
    if (submitEl) submitEl.textContent = otpSubmits[lang];
    if (otpEl) {
      const placeholders = { hy: "6-նիշ կոդ (ստուգեք email-ը)", en: "6-digit code (check your email)", ru: "6-значный код (проверьте email)" };
      otpEl.placeholder = placeholders[lang];
    }
  }
}

if (langBtn) {
  langBtn.addEventListener("click", () => {
    if (currentLang === "hy") applyLanguage("ru");
    else if (currentLang === "ru") applyLanguage("en");
    else applyLanguage("hy");
  });
}

if (themeBtn) {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeBtn.textContent = "☀️";
  }
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    if (document.body.classList.contains("light")) {
      localStorage.setItem("theme", "light"); themeBtn.textContent = "☀️";
    } else {
      localStorage.setItem("theme", "dark"); themeBtn.textContent = "🌙";
    }
  });
}


// SCROLL ANIMATIONS

const reveals = document.querySelectorAll(".reveal");
const cards   = document.querySelectorAll(".card");
const hero    = document.querySelector(".hero");

function revealOnScroll() {
  const wh = window.innerHeight;
  reveals.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < wh - 100 && r.bottom > 100) el.classList.add("active");
    else el.classList.remove("active");
  });
}
function showCards() {
  const wh = window.innerHeight;
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    if (r.top < wh - 50 && r.bottom > 50) setTimeout(() => card.classList.add("show"), i * 150);
    else card.classList.remove("show");
  });
}
function parallaxEffect() {
  if (!hero) return;
  hero.style.backgroundPositionY = window.scrollY * 0.5 + "px";
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { revealOnScroll(); showCards(); parallaxEffect(); ticking = false; });
    ticking = true;
  }
});
window.addEventListener("load", () => {
  applyLanguage(currentLang);
  revealOnScroll();
  showCards();
  parallaxEffect();
  updateUserBtn();
  updateForgotPasswordVisibility();

  // NOTICE MODAL

  const noticeModal    = document.getElementById("noticeModal");
  const noticeCloseBtn = document.getElementById("noticeCloseBtn");
  if (noticeModal && noticeCloseBtn) {
    if (sessionStorage.getItem("noticeSeen")) {
      noticeModal.style.display = "none";
    }
    noticeCloseBtn.onclick = () => {
      noticeModal.style.display = "none";
      sessionStorage.setItem("noticeSeen", "1");
    };
  }
});

// PROTECTED MATERIALS

document.querySelectorAll(".protected, .card").forEach(link => {
  link.addEventListener("click", (e) => {
    if (!localStorage.getItem("user")) {
      e.preventDefault();
      const msgs = { hy: "Գրանցվեք նյութերը տեսնելու համար", en: "Please register to view materials", ru: "Зарегистрируйтесь для просмотра материалов" };
      alert(msgs[currentLang] || msgs.hy);
    }
  });
});


// SHA-256 HASH

async function hashPassword(password) {
  const msgBuffer  = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}


// PASSWORD VISIBILITY TOGGLE (eye button)

// Delegated listener so it works for static AND dynamically created password fields
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".eye-toggle");
  if (!btn) return;
  const target = document.getElementById(btn.dataset.target);
  if (!target) return;
  if (target.type === "password") {
    target.type = "text";
    btn.textContent = "🙈";
  } else {
    target.type = "password";
    btn.textContent = "👁";
  }
});

// Builds a password input wrapped with its own eye-toggle button
function createPasswordWrapper(inputId, placeholderText) {
  const wrapper = document.createElement("div");
  wrapper.className = "password-wrapper";
  wrapper.id = inputId + "Wrapper";

  const input = document.createElement("input");
  input.type = "password";
  input.id = inputId;
  input.placeholder = placeholderText;

  const eyeBtn = document.createElement("button");
  eyeBtn.type = "button";
  eyeBtn.className = "eye-toggle";
  eyeBtn.dataset.target = inputId;
  eyeBtn.textContent = "👁";

  wrapper.appendChild(input);
  wrapper.appendChild(eyeBtn);
  return wrapper;
}


// CONFIG

const SHEETS_URL          = "https://script.google.com/macros/s/AKfycbz52eKPzz-OW-W06T3jYIWqwUUEsgwukINTTfYYAL10udhRGWda3dz0YzfYSTX_-13N/exec";
const EMAILJS_PUBLIC_KEY  = "TpX0VUVEFxF-dM6vm";
const EMAILJS_SERVICE_ID  = "service_7pkmsxi";
const EMAILJS_TEMPLATE_ID = "template_ag8gqf8";

const emailjsScript = document.createElement("script");
emailjsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
document.head.appendChild(emailjsScript);
emailjsScript.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);


// Google Sheets JSONP հարցում

function sheetsRequest(action, email, password, extra) {
  return new Promise((resolve) => {
    const cbName = "gcb_" + Date.now();
    const script = document.createElement("script");
    let url = SHEETS_URL
      + "?action="   + encodeURIComponent(action)
      + "&email="    + encodeURIComponent(email)
      + "&password=" + encodeURIComponent(password)
      + "&callback=" + cbName;
    if (extra) url += "&" + extra;

    window[cbName] = (data) => {
      delete window[cbName];
      document.head.removeChild(script);
      resolve(data);
    };
    script.onerror = () => {
      delete window[cbName];
      document.head.removeChild(script);
      const msgs = { hy: "Սերվերի հետ կապ չկա", en: "No server connection", ru: "Нет связи с сервером" };
      resolve({ success: false, message: msgs[currentLang] || msgs.hy });
    };
    script.src = url;
    document.head.appendChild(script);
  });
}


// USER BUTTON

function updateUserBtn() {
  const registerBtn = document.getElementById("registerBtn");
  if (!registerBtn) return;
  registerBtn.classList.toggle("logged-in", !!localStorage.getItem("user"));
}


// PROFILE MODAL

const profileLangTexts = {
  hy: { title: "Անձնական էջ", logout: "🚪 Դուրս գալ", deleteAcc: "🗑️ Ջնջել հաշիվը", twoFA: "🔐 2-փուլային հաստատում", admin: "⚙️ Admin պանել", confirmDelete: "Վստա՞հ եք, որ ուզում եք ջնջել հաշիվը։ Այս գործողությունը հետ չի վերադառնա։", deleting: "Ջնջվում է...", logoutOk: "Դուք դուրս եկաք ✓", deleteOk: "Հաշիվը ջնջված է ✓", error: "Սխալ տեղի ունեցավ։ Փորձեք կրկին։" },
  en: { title: "Profile", logout: "🚪 Log Out", deleteAcc: "🗑️ Delete Account", twoFA: "🔐 Two-factor authentication", admin: "⚙️ Admin Panel", confirmDelete: "Are you sure you want to delete your account? This action cannot be undone.", deleting: "Deleting...", logoutOk: "Logged out ✓", deleteOk: "Account deleted ✓", error: "An error occurred. Please try again." },
  ru: { title: "Личный кабинет", logout: "🚪 Выйти", deleteAcc: "🗑️ Удалить аккаунт", twoFA: "🔐 Двухфакторная аутентификация", admin: "⚙️ Admin панель", confirmDelete: "Вы уверены, что хотите удалить аккаунт? Это действие необратимо.", deleting: "Удаление...", logoutOk: "Вы вышли ✓", deleteOk: "Аккаунт удалён ✓", error: "Произошла ошибка. Попробуйте снова." }
};

function getProfileTexts() {
  return profileLangTexts[currentLang] || profileLangTexts.hy;
}

function updateProfileTexts() {
  const pm = document.getElementById("profileModal");
  if (!pm) return;

  const t = getProfileTexts();
  const titleEl  = pm.querySelector(".profile-title");
  const twoFAEl  = pm.querySelector(".profile-2fa-text");
  const logoutEl = document.getElementById("logoutBtn");
  const deleteEl = document.getElementById("deleteAccountBtn");
  const adminEl  = document.getElementById("adminPanelBtn");

  if (titleEl)  titleEl.textContent = t.title;
  if (twoFAEl)  twoFAEl.textContent = t.twoFA;
  if (logoutEl) logoutEl.textContent = t.logout;
  if (deleteEl && !deleteEl.disabled) deleteEl.textContent = t.deleteAcc;
  if (adminEl)  adminEl.textContent = t.admin;
}

function openProfileModal() {
  const t = getProfileTexts();

  if (!document.getElementById("profileModal")) {
    const pm = document.createElement("div");
    pm.id = "profileModal";
    pm.className = "profile-modal";
    pm.innerHTML = `
      <div class="profile-modal-content">
        <span id="closeProfileModal" class="profile-close">&times;</span>

        ${JSON.parse(localStorage.getItem("user"))?.role === "admin" ? `
        <button id="adminPanelBtn" class="profile-action-btn profile-admin-btn">${t.admin}</button>` : ""}

        <div class="profile-icon">👤</div>
        <h2 class="profile-title">${t.title}</h2>
        <p id="profileEmail" class="profile-email"></p>
        <button id="logoutBtn" class="profile-action-btn profile-logout-btn">${t.logout}</button>
        <button id="deleteAccountBtn" class="profile-action-btn profile-delete-btn">${t.deleteAcc}</button>
        <div class="profile-2fa-row">
          <label class="profile-2fa-label">
            <span class="profile-2fa-text">${t.twoFA}</span>
            <input type="checkbox" id="twoFAToggle" class="profile-2fa-toggle">
          </label>
        </div>
      </div>
    `;
    document.body.appendChild(pm);

    document.getElementById("closeProfileModal").onclick = () => pm.style.display = "none";
    const adminBtn = document.getElementById("adminPanelBtn");
    if (adminBtn) adminBtn.onclick = () => { pm.style.display = "none"; openAdminPanel(); };
    pm.addEventListener("click", (e) => { if (e.target === pm) pm.style.display = "none"; });

    document.getElementById("logoutBtn").onclick = () => {
      const t = getProfileTexts();
      localStorage.removeItem("user");
      pm.style.display = "none";
      updateUserBtn();
      alert(t.logoutOk);
      location.reload();
    };

    document.getElementById("deleteAccountBtn").onclick = async () => {
      const t = getProfileTexts();
      if (!window.confirm(t.confirmDelete)) return;
      const userData = JSON.parse(localStorage.getItem("user"));
      const delBtn = document.getElementById("deleteAccountBtn");
      delBtn.textContent = t.deleting;
      delBtn.disabled = true;
      const result = await sheetsRequest("delete", userData.email, "");
      if (result.success) {
        localStorage.removeItem("user");
        pm.style.display = "none";
        updateUserBtn();
        alert(t.deleteOk);
        location.reload();
      } else {
        alert(t.error);
        delBtn.textContent = t.deleteAcc;
        delBtn.disabled = false;
      }
    };

    const twoFAToggle = document.getElementById("twoFAToggle");
    const userData2 = JSON.parse(localStorage.getItem("user"));
    sheetsRequest("getUser", userData2.email, "").then(r => {
      if (r.success) twoFAToggle.checked = r.twoFA;
    });
    twoFAToggle.addEventListener("change", async () => {
      const val = twoFAToggle.checked ? "true" : "false";
      const u = JSON.parse(localStorage.getItem("user"));
      const r = await sheetsRequest("toggle2fa", u.email, "", "value=" + val);
      if (!r.success) {
        const errMsgs = { hy: "Սխալ տեղի ունեցավ", en: "An error occurred", ru: "Произошла ошибка" };
        alert(errMsgs[currentLang] || errMsgs.hy);
        twoFAToggle.checked = !twoFAToggle.checked;
      }
    });
  }

  const userData = JSON.parse(localStorage.getItem("user"));
  document.getElementById("profileEmail").textContent = userData.email;
  updateProfileTexts();
  document.getElementById("profileModal").style.display = "block";
}


// AUTH MODAL

const modal     = document.getElementById("authModal");
const openBtn   = document.getElementById("registerBtn");
const closeBtn  = document.getElementById("closeModal");
const submitBtn = document.getElementById("authSubmit");
const switchModeEl = document.getElementById("switchMode");

let isLogin = false, generatedOTP = null, otpStep = false;
let forgotStep = null, forgotEmail = "", forgotOTP = null; // null | "email" | "otp" | "newpass"

openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (localStorage.getItem("user")) {
    openProfileModal();
  } else {
    modal.style.display = "block";
  }
});

closeBtn.onclick = () => { modal.style.display = "none"; resetModal(); };
window.onclick = (e) => { if (e.target === modal) { modal.style.display = "none"; resetModal(); } };

switchModeEl.onclick = () => {
  isLogin = !isLogin;
  updateAuthTexts(currentLang, isLogin ? "login" : "register");
  updateForgotPasswordVisibility();
};

function resetModal() {
  otpStep = false; generatedOTP = null;
  exitForgotFlow();
  document.getElementById("authEmail").style.display        = "";
  document.getElementById("authPasswordWrapper").style.display = "";
  document.getElementById("switchText").style.display        = "";
  document.getElementById("authEmail").value    = "";
  document.getElementById("authPassword").value = "";
  document.getElementById("authPassword").type  = "password";
  const otpEl = document.getElementById("otpInput");
  if (otpEl) otpEl.remove();
  updateAuthTexts(currentLang, isLogin ? "login" : "register");
  submitBtn.disabled = false;
  updateForgotPasswordVisibility();
}

function showOTPInput() {
  document.getElementById("authEmail").style.display        = "none";
  document.getElementById("authPasswordWrapper").style.display = "none";
  document.getElementById("switchText").style.display        = "none";
  document.getElementById("forgotPasswordText").style.display = "none";
  if (!document.getElementById("otpInput")) {
    const inp = document.createElement("input");
    inp.type = "text"; inp.id = "otpInput";
    const placeholders = { hy: "6-նիշ կոդ (ստուգեք email-ը)", en: "6-digit code (check your email)", ru: "6-значный код (проверьте email)" };
    inp.placeholder = placeholders[currentLang] || placeholders.hy;
    inp.maxLength = 6;
    inp.className = "otp-input";
    submitBtn.insertAdjacentElement("beforebegin", inp);
    inp.focus();
  }
  const otpTitles  = { hy: "Հաստատեք Email-ը", en: "Confirm Email", ru: "Подтвердите Email" };
  const otpSubmits = { hy: "Հաստատել", en: "Confirm", ru: "Подтвердить" };
  document.getElementById("authTitle").textContent  = otpTitles[currentLang]  || otpTitles.hy;
  submitBtn.textContent = otpSubmits[currentLang] || otpSubmits.hy;
  otpStep = true;
}


// FORGOT PASSWORD FLOW

const forgotPasswordBtn  = document.getElementById("forgotPasswordBtn");
const forgotPasswordText = document.getElementById("forgotPasswordText");
const forgotCancelBtn    = document.getElementById("forgotCancelBtn");
const forgotCancelText    = document.getElementById("forgotCancelText");

// The "Forgot password?" link only makes sense in login mode, and only
// while we're not already mid-OTP or mid-forgot-flow.
function updateForgotPasswordVisibility() {
  if (!forgotPasswordText) return;
  forgotPasswordText.style.display = (isLogin && !otpStep && !forgotStep) ? "block" : "none";
}

if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", () => enterForgotFlow());
}
if (forgotCancelBtn) {
  forgotCancelBtn.addEventListener("click", () => {
    exitForgotFlow();
    updateAuthTexts(currentLang, isLogin ? "login" : "register");
    updateForgotPasswordVisibility();
  });
}

function enterForgotFlow() {
  forgotStep = "email";
  document.getElementById("authPasswordWrapper").style.display = "none";
  document.getElementById("switchText").style.display          = "none";
  forgotPasswordText.style.display = "none";
  forgotCancelText.style.display   = "block";
  document.getElementById("authEmail").value = "";
  document.getElementById("authEmail").focus();
  updateForgotTexts();
}

function showForgotOtpStep() {
  document.getElementById("authEmail").style.display = "none";
  if (!document.getElementById("forgotOtpInput")) {
    const inp = document.createElement("input");
    inp.type = "text"; inp.id = "forgotOtpInput";
    const placeholders = { hy: "6-նիշ կոդ (ստուգեք email-ը)", en: "6-digit code (check your email)", ru: "6-значный код (проверьте email)" };
    inp.placeholder = placeholders[currentLang] || placeholders.hy;
    inp.maxLength = 6;
    inp.className = "otp-input";
    submitBtn.insertAdjacentElement("beforebegin", inp);
    inp.focus();
  }
  updateForgotTexts();
}

function showForgotNewPasswordStep() {
  const otpEl = document.getElementById("forgotOtpInput");
  if (otpEl) otpEl.remove();

  if (!document.getElementById("newPassword1Wrapper")) {
    const ph1 = { hy: "Նոր գաղտնաբառ",        en: "New password",     ru: "Новый пароль" };
    const ph2 = { hy: "Կրկնեք գաղտնաբառը",     en: "Repeat password",  ru: "Повторите пароль" };
    const w1 = createPasswordWrapper("newPassword1", ph1[currentLang] || ph1.hy);
    const w2 = createPasswordWrapper("newPassword2", ph2[currentLang] || ph2.hy);
    submitBtn.insertAdjacentElement("beforebegin", w1);
    submitBtn.insertAdjacentElement("beforebegin", w2);
    document.getElementById("newPassword1").focus();
  }
  updateForgotTexts();
}

// Sets the modal title and submit-button text for the current forgot-password step
function updateForgotTexts() {
  if (!forgotStep) return;
  const L = currentLang;
  const titles = {
    email:   { hy: "Վերականգնել գաղտնաբառը", en: "Reset Password",   ru: "Восстановление пароля" },
    otp:     { hy: "Մուտքագրեք կոդը",         en: "Enter the Code",   ru: "Введите код" },
    newpass: { hy: "Նոր գաղտնաբառ",           en: "New Password",     ru: "Новый пароль" }
  };
  const submits = {
    email:   { hy: "Ուղարկել կոդ",        en: "Send Code",        ru: "Отправить код" },
    otp:     { hy: "Հաստատել",            en: "Confirm",          ru: "Подтвердить" },
    newpass: { hy: "Փոխել գաղտնաբառը",    en: "Change Password",  ru: "Изменить пароль" }
  };
  const titleEl = document.getElementById("authTitle");
  if (titleEl) titleEl.textContent = (titles[forgotStep][L] || titles[forgotStep].hy);
  submitBtn.textContent = (submits[forgotStep][L] || submits[forgotStep].hy);
}

// Tears down whatever forgot-password UI is currently shown and restores the normal login/register form
function exitForgotFlow() {
  forgotStep = null;
  forgotEmail = "";
  forgotOTP = null;

  const otpEl = document.getElementById("forgotOtpInput");
  if (otpEl) otpEl.remove();
  const np1 = document.getElementById("newPassword1Wrapper");
  if (np1) np1.remove();
  const np2 = document.getElementById("newPassword2Wrapper");
  if (np2) np2.remove();

  document.getElementById("authEmail").style.display            = "";
  document.getElementById("authPasswordWrapper").style.display  = "";
  document.getElementById("switchText").style.display           = "";
  if (forgotCancelText) forgotCancelText.style.display = "none";
  submitBtn.disabled = false;
}


// SUBMIT

submitBtn.onclick = async () => {

  // ===== FORGOT PASSWORD: STEP 1 — send code to email =====
  if (forgotStep === "email") {
    const email = document.getElementById("authEmail").value.trim();
    const L = currentLang;

    const fillAll  = { hy: "Լրացրու բոլոր դաշտերը", en: "Please fill in all fields", ru: "Заполните все поля" };
    const badEmail = { hy: "Սխալ էլ. փոստ", en: "Invalid email", ru: "Неверный email" };
    if (!email)                                       { alert(fillAll[L]  || fillAll.hy);  return; }
    if (!email.includes("@") || !email.includes(".")) { alert(badEmail[L] || badEmail.hy); return; }

    const checkingMsgs = { hy: "Ստուգվում է...", en: "Checking...", ru: "Проверка..." };
    submitBtn.disabled = true;
    submitBtn.textContent = checkingMsgs[L] || checkingMsgs.hy;

    const checkResult = await sheetsRequest("checkEmail", email, "");
    submitBtn.disabled = false;

    const noAccountMsgs = { hy: "Այս մեյլով հաշիվ չի գտնվել", en: "No account found with this email", ru: "Аккаунт с таким email не найден" };
    if (!checkResult.exists) {
      alert(noAccountMsgs[L] || noAccountMsgs.hy);
      updateForgotTexts();
      return;
    }

    forgotEmail = email;
    forgotOTP   = Math.floor(100000 + Math.random() * 900000);

    const sendingMsgs = { hy: "Ուղարկվում է...", en: "Sending...", ru: "Отправка..." };
    submitBtn.disabled = true;
    submitBtn.textContent = sendingMsgs[L] || sendingMsgs.hy;

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
        { to_email: email, code: String(forgotOTP) },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      forgotStep = "otp";
      showForgotOtpStep();
    } catch (err) {
      const emailErrMsgs = { hy: "Email-ը չհաջողվեց ուղարկել։ Փորձեք կրկին։", en: "Failed to send email. Try again.", ru: "Не удалось отправить email. Попробуйте снова." };
      alert(emailErrMsgs[L] || emailErrMsgs.hy);
      console.error("EmailJS error:", err);
    } finally {
      submitBtn.disabled = false;
      if (forgotStep === "email") updateForgotTexts();
    }
    return;
  }

  // ===== FORGOT PASSWORD: STEP 2 — verify code =====

  if (forgotStep === "otp") {
    const otpField = document.getElementById("forgotOtpInput");
    const entered  = otpField ? otpField.value.trim() : "";
    const wrongCode = { hy: "Սխալ կոդ։ Փորձեք կրկին", en: "Wrong code. Try again", ru: "Неверный код. Попробуйте снова" };
    if (entered !== String(forgotOTP)) { alert(wrongCode[currentLang] || wrongCode.hy); return; }

    forgotStep = "newpass";
    showForgotNewPasswordStep();
    return;
  }

  // ===== FORGOT PASSWORD: STEP 3 — set new password =====

  if (forgotStep === "newpass") {
    const L  = currentLang;
    const p1 = document.getElementById("newPassword1").value.trim();
    const p2 = document.getElementById("newPassword2").value.trim();

    const fillAll   = { hy: "Լրացրու բոլոր դաշտերը", en: "Please fill in all fields", ru: "Заполните все поля" };
    const noMatch   = { hy: "Գաղտնաբառերը չեն համընկնում", en: "Passwords do not match", ru: "Пароли не совпадают" };
    const shortPwd  = { hy: "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ", en: "Password must be at least 6 characters", ru: "Пароль должен содержать не менее 6 символов" };
    const longPwd   = { hy: "Գաղտնաբառը չպետք է գերազանցի 30 նիշը", en: "Password must not exceed 30 characters", ru: "Пароль не должен превышать 30 символов" };
    const needNum   = { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 թիվ", en: "Password must contain at least 1 number", ru: "Пароль должен содержать хотя бы 1 цифру" };
    const needUpper = { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 մեծատառ", en: "Password must contain at least 1 uppercase letter", ru: "Пароль должен содержать хотя бы 1 заглавную букву" };
    const needSym   = { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 սիմվոլ", en: "Password must contain at least 1 symbol", ru: "Пароль должен содержать хотя бы 1 символ" };

    if (!p1 || !p2) { alert(fillAll[L]  || fillAll.hy);  return; }
    if (p1 !== p2)  { alert(noMatch[L]  || noMatch.hy);  return; }
    if (p1.length < 6)  { alert(shortPwd[L] || shortPwd.hy); return; }
    if (p1.length > 30) { alert(longPwd[L]  || longPwd.hy);  return; }
    if (!/[0-9]/.test(p1))                                              { alert(needNum[L]   || needNum.hy);   return; }
    if (!/[A-Z]/.test(p1))                                              { alert(needUpper[L] || needUpper.hy); return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p1))            { alert(needSym[L]   || needSym.hy);   return; }

    const hashedNew = await hashPassword(p1);

    const savingMsgs = { hy: "Պահպանվում է...", en: "Saving...", ru: "Сохранение..." };
    submitBtn.disabled = true;
    submitBtn.textContent = savingMsgs[L] || savingMsgs.hy;

    const result = await sheetsRequest("resetPassword", forgotEmail, hashedNew);
    submitBtn.disabled = false;

    const errMsgs = { hy: "Սխալ տեղի ունեցավ։ Փորձեք կրկին։", en: "An error occurred. Please try again.", ru: "Произошла ошибка. Попробуйте снова." };
    if (!result.success) {
      alert(result.message || (errMsgs[L] || errMsgs.hy));
      return;
    }

    const successMsgs = { hy: "Գաղտնաբառը հաջողությամբ փոխվեց ✓\nՀիմա մուտք գործեք նոր գաղտնաբառով", en: "Password changed successfully ✓\nNow log in with your new password", ru: "Пароль успешно изменён ✓\nТеперь войдите с новым паролем" };
    alert(successMsgs[L] || successMsgs.hy);

    const savedEmail = forgotEmail;
    exitForgotFlow();
    isLogin = true;
    updateAuthTexts(currentLang, "login");
    updateForgotPasswordVisibility();
    document.getElementById("authEmail").value    = savedEmail;
    document.getElementById("authPassword").value = "";
    return;
  }

  // OTP CHECK

  if (otpStep) {
    const entered  = document.getElementById("otpInput").value.trim();
    const email    = document.getElementById("authEmail").dataset.value;
    const password = document.getElementById("authPassword").dataset.value;

    const wrongCode = { hy: "Սխալ կոդ։ Փորձեք կրկին", en: "Wrong code. Try again", ru: "Неверный код. Попробуйте снова" };
    if (entered !== String(generatedOTP)) { alert(wrongCode[currentLang] || wrongCode.hy); return; }

    const checkingMsgs  = { hy: "Ստուգվում է...", en: "Checking...", ru: "Проверка..." };
    const savingMsgs    = { hy: "Պահպանվում է...", en: "Saving...", ru: "Сохранение..." };
    submitBtn.disabled  = true;
    submitBtn.textContent = isLogin ? (checkingMsgs[currentLang] || checkingMsgs.hy) : (savingMsgs[currentLang] || savingMsgs.hy);

    const loginResult = await sheetsRequest(isLogin ? "login" : "register", email, password);
    submitBtn.disabled = false;

    const errMsgs     = { hy: "Սխալ տվյալներ", en: "Invalid credentials", ru: "Неверные данные" };
    const regFailMsgs = { hy: "Գրանցումը չհաջողվեց", en: "Registration failed", ru: "Ошибка регистрации" };
    if (!loginResult.success) {
      alert(loginResult.message || (isLogin ? (errMsgs[currentLang] || errMsgs.hy) : (regFailMsgs[currentLang] || regFailMsgs.hy)));
      resetModal();
      return;
    }

    if (isLogin) {
      localStorage.setItem("user", JSON.stringify({ email, role: loginResult.role }));
      const okMsgs = { hy: "Մուտք հաջողվեց ✓", en: "Logged in ✓", ru: "Вход выполнен ✓" };
      alert(okMsgs[currentLang] || okMsgs.hy);
      modal.style.display = "none";
      resetModal();
      updateUserBtn();
      return;
    } else {
      const regOkMsgs = { hy: "Գրանցումը հաջողվեց ✓\nՀիմա մուտք գործեք ձեր տվյալներով", en: "Registration successful ✓\nNow log in with your credentials", ru: "Регистрация успешна ✓\nТеперь войдите с вашими данными" };
      alert(regOkMsgs[currentLang] || regOkMsgs.hy);
      resetModal();
      isLogin = true;
      updateAuthTexts(currentLang, "login");
    }
    return;
  }

  // FORM VALIDATION

  const email    = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  const fillAll  = { hy: "Լրացրու բոլոր դաշտերը", en: "Please fill in all fields", ru: "Заполните все поля" };
  const badEmail = { hy: "Սխալ էլ. փոստ", en: "Invalid email", ru: "Неверный email" };
  const shortPwd = { hy: "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ", en: "Password must be at least 6 characters", ru: "Пароль должен содержать не менее 6 символов" };
  const longPwd  = { hy: "Գաղտնաբառը չպետք է գերազանցի 30 նիշը", en: "Password must not exceed 30 characters", ru: "Пароль не должен превышать 30 символов" };
  const needNum  = { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 թիվ", en: "Password must contain at least 1 number", ru: "Пароль должен содержать хотя бы 1 цифру" };
  const needUpper= { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 մեծատառ", en: "Password must contain at least 1 uppercase letter", ru: "Пароль должен содержать хотя бы 1 заглавную букву" };
  const needSym  = { hy: "Գաղտնաբառը պետք է պարունակի առնվազն 1 սիմվոլ", en: "Password must contain at least 1 symbol", ru: "Пароль должен содержать хотя бы 1 символ" };

  const L = currentLang;
  if (!email || !password)                           { alert(fillAll[L]   || fillAll.hy);   return; }
  if (!email.includes("@") || !email.includes(".")) { alert(badEmail[L]  || badEmail.hy);  return; }
  if (password.length < 6)                          { alert(shortPwd[L]  || shortPwd.hy);  return; }
  if (password.length > 30)                         { alert(longPwd[L]   || longPwd.hy);   return; }

  if (!isLogin) {
    if (!/[0-9]/.test(password))                                              { alert(needNum[L]   || needNum.hy);   return; }
    if (!/[A-Z]/.test(password))                                              { alert(needUpper[L] || needUpper.hy); return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))            { alert(needSym[L]   || needSym.hy);   return; }
  }

  // HASH

  const hashedPassword = await hashPassword(password);
  document.getElementById("authEmail").dataset.value    = email;
  document.getElementById("authPassword").dataset.value = hashedPassword;

  // SEND OTP

  const checkingMsgs = { hy: "Ստուգվում է...", en: "Checking...", ru: "Проверка..." };
  submitBtn.textContent = checkingMsgs[L] || checkingMsgs.hy;
  submitBtn.disabled  = true;

  if (!isLogin) {
    const checkResult = await sheetsRequest("checkEmail", email, "");
    if (checkResult.exists) {
      const existsMsgs = { hy: "Այս մեյլով հաշիվ արդեն գոյություն ունի։ Մուտք գործեք։", en: "An account with this email already exists. Please log in.", ru: "Аккаунт с таким email уже существует. Войдите." };
      alert(existsMsgs[L] || existsMsgs.hy);
      submitBtn.disabled = false;
      updateAuthTexts(L, "register");
      return;
    }
  } else {
    const loginResult = await sheetsRequest("login", email, hashedPassword);
    submitBtn.disabled = false;
    if (!loginResult.success) {
      const errMsgs = { hy: "Սխալ տվյալներ", en: "Invalid credentials", ru: "Неверные данные" };
      alert(loginResult.message || (errMsgs[L] || errMsgs.hy));
      return;
    }
    if (!loginResult.twoFA) {
      localStorage.setItem("user", JSON.stringify({ email, role: loginResult.role }));
      const okMsgs = { hy: "Մուտք հաջողվեց ✓", en: "Logged in ✓", ru: "Вход выполнен ✓" };
      alert(okMsgs[L] || okMsgs.hy);
      modal.style.display = "none";
      resetModal();
      updateUserBtn();
      return;
    }
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000);
  const sendingMsgs = { hy: "Ուղարկվում է...", en: "Sending...", ru: "Отправка..." };
  submitBtn.textContent = sendingMsgs[L] || sendingMsgs.hy;
  submitBtn.disabled  = true;

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
      { to_email: email, code: String(generatedOTP) },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
    showOTPInput();
  } catch (err) {
    const emailErrMsgs = { hy: "Email-ը չհաջողվեց ուղարկել։ Ստուգեք EmailJS կարգավորումները։", en: "Failed to send email. Check EmailJS settings.", ru: "Не удалось отправить email. Проверьте настройки EmailJS." };
    alert(emailErrMsgs[L] || emailErrMsgs.hy);
    console.error("EmailJS error:", err);
  } finally {
    submitBtn.disabled = false;
    if (!otpStep) updateAuthTexts(L, isLogin ? "login" : "register");
  }
};


// ADMIN PANEL

function updateAdminPanelTexts() {
  const ap = document.getElementById("adminPanel");
  if (!ap) return;

  const titles = { hy: "⚙️ Admin պանել", en: "⚙️ Admin Panel", ru: "⚙️ Admin панель" };
  const titleEl = ap.querySelector(".admin-title");
  if (titleEl) titleEl.textContent = titles[currentLang] || titles.hy;

  const usersList = document.getElementById("usersList");
  if (usersList && usersList.children.length) loadUsers();
}

function openAdminPanel() {
  if (document.getElementById("adminPanel")) {
    document.getElementById("adminPanel").style.display = "block";
    loadUsers();
    return;
  }

  const titles   = { hy: "⚙️ Admin պանել", en: "⚙️ Admin Panel", ru: "⚙️ Admin панель" };
  const loadings = { hy: "Բեռնվում է...", en: "Loading...", ru: "Загрузка..." };
  const L = currentLang;

  const ap = document.createElement("div");
  ap.id = "adminPanel";
  ap.className = "admin-panel";
  ap.innerHTML = `
    <div class="admin-panel-content">
      <span id="closeAdminPanel" class="admin-close">&times;</span>
      <h2 class="admin-title">${titles[L] || titles.hy}</h2>
      <div id="usersList" class="users-list">${loadings[L] || loadings.hy}</div>
    </div>
  `;
  document.body.appendChild(ap);

  document.getElementById("closeAdminPanel").onclick = () => ap.style.display = "none";
  ap.addEventListener("click", (e) => { if (e.target === ap) ap.style.display = "none"; });

  loadUsers();
}

async function loadUsers() {
  const u = JSON.parse(localStorage.getItem("user"));
  const result = await sheetsRequest("getUsers", u.email, u.password || "");
  const container = document.getElementById("usersList");
  const errMsgs = { hy: "Սխալ", en: "Error", ru: "Ошибка" };
  if (!result.success) { container.innerHTML = `<p style='color:red'>${errMsgs[currentLang] || errMsgs.hy}</p>`; return; }

  const makeAdminLabels = { hy: "Admin դարձնել", en: "Make Admin", ru: "Сделать Admin" };
  const makeUserLabels  = { hy: "User դարձնել",  en: "Make User",  ru: "Сделать User"  };
  const deleteLabels    = { hy: "Ջնջել",          en: "Delete",     ru: "Удалить"        };
  const L = currentLang;

  container.innerHTML = result.users.map(user => `
    <div class="admin-user-card">
      <div>
        <div class="admin-user-email">${user.email}</div>
        <div class="admin-user-meta">${user.date ? user.date.substring(0,10) : ""} · 2FA: ${user.twoFA ? "✓" : "✗"}</div>
      </div>
      <div class="admin-user-actions">
        <span class="admin-role-badge ${user.role === "admin" ? "role-admin" : "role-user"}">${user.role}</span>
        ${user.role !== "admin" ? `
        <button onclick="setUserRole('${user.email}', 'admin')" class="admin-small-btn make-admin-btn">${makeAdminLabels[L] || makeAdminLabels.hy}</button>` : `
        <button onclick="setUserRole('${user.email}', 'user')" class="admin-small-btn make-user-btn">${makeUserLabels[L] || makeUserLabels.hy}</button>`}
        <button onclick="deleteUserAdmin('${user.email}')" class="admin-small-btn admin-delete-user-btn">${deleteLabels[L] || deleteLabels.hy}</button>
      </div>
    </div>
  `).join("");
}

async function setUserRole(targetEmail, newRole) {
  const u = JSON.parse(localStorage.getItem("user"));
  const r = await sheetsRequest("setRole", u.email, "", `target=${encodeURIComponent(targetEmail)}&role=${newRole}`);
  const errMsgs = { hy: "Սխալ տեղի ունեցավ", en: "An error occurred", ru: "Произошла ошибка" };
  if (r.success) loadUsers();
  else alert(errMsgs[currentLang] || errMsgs.hy);
}

async function deleteUserAdmin(targetEmail) {
  const confirmMsgs = { hy: `Ջնջե՞լ ${targetEmail} հաշիվը։`, en: `Delete account ${targetEmail}?`, ru: `Удалить аккаунт ${targetEmail}?` };
  const errMsgs     = { hy: "Սխալ տեղի ունեցավ", en: "An error occurred", ru: "Произошла ошибка" };
  if (!confirm(confirmMsgs[currentLang] || confirmMsgs.hy)) return;
  const u = JSON.parse(localStorage.getItem("user"));
  const r = await sheetsRequest("deleteUser", u.email, "", `target=${encodeURIComponent(targetEmail)}`);
  if (r.success) loadUsers();
  else alert(errMsgs[currentLang] || errMsgs.hy);
}