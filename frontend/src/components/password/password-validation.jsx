import { useState, useEffect } from "react";
import { validatePassword, isPasswordValid } from "./password-config";

export function usePasswordValidation(password) {
  const [debouncedPassword, setDebouncedPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    lowercase: true,
    uppercase: true,
    number: true,
    special: true,
  });

  // Password validation regex patterns
  const lengthRegex = /.{8,}/;
  const lowercaseRegex = /[a-z]/;
  const uppercaseRegex = /[A-Z]/;
  const numberRegex = /\d/;
  const specialRegex = /[!@#$%^&*()_\-+=]/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPassword(password);
      if (password) {
        setShowRequirements(true);
      } else {
        setShowRequirements(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password]);

  // Validate password
  useEffect(() => {
    if (!debouncedPassword) {
      return;
    }

    const errors = {
      length: !lengthRegex.test(debouncedPassword),
      lowercase: !lowercaseRegex.test(debouncedPassword),
      uppercase: !uppercaseRegex.test(debouncedPassword),
      number: !numberRegex.test(debouncedPassword),
      special: !specialRegex.test(debouncedPassword),
    };

    setPasswordErrors(errors);

    if (Object.values(errors).every((error) => !error)) {
      setShowRequirements(false);
    }
  }, [debouncedPassword]);

  const isPasswordValid = passwordRegex.test(password);

  return { 
    passwordErrors, 
    showRequirements, 
    setShowRequirements,
    isPasswordValid,
    passwordRegex
  };
}
