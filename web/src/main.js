import { supabase } from './supabase'

// Stan aplikacji (czy logowanie, czy rejestracja)
let isLoginMode = true

// Elementy DOM
const authView = document.getElementById('auth-view')
const dashboardView = document.getElementById('dashboard-view')

const authForm = document.getElementById('auth-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const confirmPasswordGroup = document.getElementById('confirm-password-group')
const confirmPasswordInput = document.getElementById('confirm-password')
const submitBtn = document.getElementById('auth-submit-btn')
const errorMsg = document.getElementById('auth-error-msg')

const authSubtitle = document.getElementById('auth-subtitle')
const authToggleBtn = document.getElementById('auth-toggle-btn')
const authToggleText = document.getElementById('auth-toggle-text')

const logoutBtn = document.getElementById('logout-btn')
const userEmailDisplay = document.getElementById('user-email-display')

// Inicjalizacja: sprawdzanie sesji przy starcie
async function init() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (session) {
    showDashboard(session.user)
  } else {
    showAuth()
  }

  // Nasłuchiwanie na zmiany stanu autentykacji (np. po wylogowaniu/zalogowaniu)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      showDashboard(session.user)
    } else if (event === 'SIGNED_OUT') {
      showAuth()
    }
  })
}

// Obsługa przełączania między trybem logowania a rejestracji
authToggleBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode
  
  errorMsg.textContent = ''
  passwordInput.value = ''
  confirmPasswordInput.value = ''

  if (isLoginMode) {
    authSubtitle.textContent = 'Zaloguj się do swojego zadania'
    submitBtn.textContent = 'Wejdź do Gry'
    authToggleText.textContent = 'Nie masz konta?'
    authToggleBtn.textContent = 'Zarejestruj się'
    confirmPasswordGroup.style.display = 'none'
    confirmPasswordInput.required = false
  } else {
    authSubtitle.textContent = 'Rozpocznij swoją przygodę'
    submitBtn.textContent = 'Stwórz Konto'
    authToggleText.textContent = 'Masz już konto?'
    authToggleBtn.textContent = 'Zaloguj się'
    confirmPasswordGroup.style.display = 'flex'
    confirmPasswordInput.required = true
  }
})

// Wyświetlanie błędu z timeoutem i prostą animacją
function showError(message) {
  errorMsg.textContent = message
  errorMsg.style.animation = 'none'
  errorMsg.offsetHeight; // Wyzwolenie reflow by zresetować animację
  errorMsg.style.animation = 'fadeIn 0.3s ease-out'
}

// Obsługa formularza
authForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const email = emailInput.value.trim()
  const password = passwordInput.value

  errorMsg.textContent = ''
  submitBtn.disabled = true
  submitBtn.textContent = 'Ładowanie...'

  try {
    if (isLoginMode) {
      // LOGOWANIE
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      if (error) throw error

    } else {
      // REJESTRACJA
      const confirmPassword = confirmPasswordInput.value
      
      if (password.length < 6) {
        throw new Error('Hasło musi mieć minimum 6 znaków.')
      }

      if (password !== confirmPassword) {
        throw new Error('Hasła nie są identyczne.')
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })
      
      if (error) throw error
      
      // Jeżeli się powiedzie ale nie ma sesji, znaczy że poszedł email weryfikacyjny (przy wyciągnięciu)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        showError('Ten email jest już zarejestrowany.')
      } else {
         // Auto-login z reguły nastąpi (wyłączyliśmy confirmations) więc onAuthStateChange nas przeniesie.
      }
    }
  } catch (error) {
    let msg = error.message
    if (msg.includes('Invalid login credentials')) {
      msg = 'Nieprawidłowy e-mail lub hasło.'
    } else if (msg.includes('User already registered')) {
      msg = 'Ten użytkownik już istnieje.'
    }
    showError(msg)
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = isLoginMode ? 'Wejdź do Gry' : 'Stwórz Konto'
  }
})

// Obsługa wylogowania
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
})

// === Logika UI ===

function showDashboard(user) {
  authView.classList.remove('active')
  dashboardView.classList.add('active')
  userEmailDisplay.textContent = user.email
}

function showAuth() {
  dashboardView.classList.remove('active')
  authView.classList.add('active')
  emailInput.value = ''
  passwordInput.value = ''
  confirmPasswordInput.value = ''
  errorMsg.textContent = ''
}

// Start
init()
