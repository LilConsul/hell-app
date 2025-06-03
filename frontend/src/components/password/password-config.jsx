// Configurația centralizată pentru validarea parolelor
export const PASSWORD_CONFIG = {
  // Regex patterns pentru validare
  patterns: {
    length: /.{8,}/,
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    number: /\d/,
    special: /[!@#$%^&*()_\-+=]/,
    // Regex complet pentru validarea întregii parole
    complete: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/
  },

  // Mesajele pentru cerințe (pentru UI)
  requirements: {
    length: "At least 8 characters",
    lowercase: "At least one lowercase letter (a-z)",
    uppercase: "At least one uppercase letter (A-Z)",
    number: "At least one number (0-9)",
    special: "At least one special character (!@#$%^&*()_-+=)"
  },

  // Mesajele scurte pentru erori (pentru Settings.jsx)
  shortRequirements: {
    length: "At least 8 characters",
    lowercase: "One lowercase letter",
    uppercase: "One uppercase letter",
    number: "One number",
    special: "One special character"
  }
};

/**
 * Validează o parolă și returnează erorile
 * @param {string} password - Parola de validat
 * @returns {Object} - Obiect cu erorile pentru fiecare criteriu
 */
export function validatePassword(password) {
  if (!password) {
    return {
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      special: true
    };
  }

  return {
    length: !PASSWORD_CONFIG.patterns.length.test(password),
    lowercase: !PASSWORD_CONFIG.patterns.lowercase.test(password),
    uppercase: !PASSWORD_CONFIG.patterns.uppercase.test(password),
    number: !PASSWORD_CONFIG.patterns.number.test(password),
    special: !PASSWORD_CONFIG.patterns.special.test(password)
  };
}

/**
 * Verifică dacă parola este validă (toate criteriile sunt îndeplinite)
 * @param {string} password - Parola de verificat
 * @returns {boolean} - True dacă parola este validă
 */
export function isPasswordValid(password) {
  return PASSWORD_CONFIG.patterns.complete.test(password);
}

/**
 * Returnează lista de erori pentru o parolă (pentru Settings.jsx)
 * @param {string} password - Parola de validat
 * @returns {string[]} - Array cu mesajele de eroare
 */
export function getPasswordErrors(password) {
  if (!password) return [];

  const errors = [];
  const validation = validatePassword(password);

  if (validation.length) errors.push(PASSWORD_CONFIG.shortRequirements.length);
  if (validation.uppercase) errors.push(PASSWORD_CONFIG.shortRequirements.uppercase);
  if (validation.lowercase) errors.push(PASSWORD_CONFIG.shortRequirements.lowercase);
  if (validation.number) errors.push(PASSWORD_CONFIG.shortRequirements.number);
  if (validation.special) errors.push(PASSWORD_CONFIG.shortRequirements.special);

  return errors;
}