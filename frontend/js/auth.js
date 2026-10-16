import { api } from './api.js';
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './constants.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const formSignin = document.getElementById('form-signin');
  const formSignup = document.getElementById('form-signup');
  const authAlert = document.getElementById('auth-alert');
  const alertText = document.getElementById('alert-text');

  const signinEmail = document.getElementById('signin-email');
  const signinPassword = document.getElementById('signin-password');
  const signinEmailError = document.getElementById('signin-email-error');
  const signinPasswordError = document.getElementById('signin-password-error');
  const btnSigninSubmit = document.getElementById('btn-signin-submit');

  const signupUsername = document.getElementById('signup-username');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupUsernameError = document.getElementById('signup-username-error');
  const signupEmailError = document.getElementById('signup-email-error');
  const signupPasswordError = document.getElementById('signup-password-error');
  const btnSignupSubmit = document.getElementById('btn-signup-submit');

  try {
    await api.getMe();
    window.location.replace('index.html');
    return;
  } catch {
  }

  function switchTab(mode) {
    clearAlert();
    clearInputErrors();

    const isSignin = mode === 'signin';
    tabSignin.classList.toggle('active', isSignin);
    tabSignup.classList.toggle('active', !isSignin);
    tabSignin.setAttribute('aria-selected', isSignin ? 'true' : 'false');
    tabSignup.setAttribute('aria-selected', isSignin ? 'false' : 'true');
    formSignin.hidden = !isSignin;
    formSignup.hidden = isSignin;

    if (isSignin) {
      signinEmail.focus();
    } else {
      signupUsername.focus();
    }
  }

  tabSignin?.addEventListener('click', () => switchTab('signin'));
  tabSignup?.addEventListener('click', () => switchTab('signup'));
  switchTab('signin');

  function showAlert(msg, type = 'error') {
    if (!authAlert || !alertText) return;
    alertText.textContent = msg;
    authAlert.className = `auth-alert ${type}`;
    authAlert.style.display = 'flex';
  }

  function clearAlert() {
    if (!authAlert) return;
    authAlert.style.display = 'none';
    authAlert.className = 'auth-alert';
  }

  function clearInputErrors() {
    document.querySelectorAll('.field-error-text').forEach((el) => {
      el.textContent = '';
    });
    document.querySelectorAll('.form-input').forEach((el) => el.classList.remove('error'));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  formSignin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    clearInputErrors();

    const email = signinEmail.value.trim();
    const password = signinPassword.value;

    let hasError = false;

    if (!email) {
      signinEmailError.textContent = 'Email address is required';
      signinEmail.classList.add('error');
      hasError = true;
    } else if (!validateEmail(email)) {
      signinEmailError.textContent = 'Please enter a valid email address';
      signinEmail.classList.add('error');
      hasError = true;
    }

    if (!password) {
      signinPasswordError.textContent = 'Password is required';
      signinPassword.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    btnSigninSubmit.disabled = true;
    btnSigninSubmit.innerHTML = '<span>Signing in...</span>';

    try {
      await api.signin({ email, password });
      showAlert('Welcome back! Redirecting to workspace...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    } catch (err) {
      showAlert(err.message || 'Failed to sign in. Please check your credentials.');
      btnSigninSubmit.disabled = false;
      btnSigninSubmit.innerHTML = '<span>Sign In</span>';
    }
  });

  formSignup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    clearInputErrors();

    const username = signupUsername.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;

    let hasError = false;

    if (!username) {
      signupUsernameError.textContent = 'Username is required';
      signupUsername.classList.add('error');
      hasError = true;
    } else if (username.length < USERNAME_MIN_LENGTH) {
      signupUsernameError.textContent = `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
      signupUsername.classList.add('error');
      hasError = true;
    } else if (username.length > USERNAME_MAX_LENGTH) {
      signupUsernameError.textContent = `Username must not exceed ${USERNAME_MAX_LENGTH} characters`;
      signupUsername.classList.add('error');
      hasError = true;
    }

    if (!email) {
      signupEmailError.textContent = 'Email address is required';
      signupEmail.classList.add('error');
      hasError = true;
    } else if (!validateEmail(email)) {
      signupEmailError.textContent = 'Please enter a valid email address';
      signupEmail.classList.add('error');
      hasError = true;
    }

    if (!password) {
      signupPasswordError.textContent = 'Password is required';
      signupPassword.classList.add('error');
      hasError = true;
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      signupPasswordError.textContent = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
      signupPassword.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    btnSignupSubmit.disabled = true;
    btnSignupSubmit.innerHTML = '<span>Creating account...</span>';

    try {
      await api.signup({ username, email, password });
      showAlert('Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    } catch (err) {
      showAlert(err.message || 'Registration failed. Please try again.');
      btnSignupSubmit.disabled = false;
      btnSignupSubmit.innerHTML = '<span>Create Account</span>';
    }
  });
});
