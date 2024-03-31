export function validateUserName(name) {
  const nameRegex = /^[ a-zA-ZñÑ0-9!@#\$%\^\&*\)\(+=._-·?¿¡]+$/g;

  return nameRegex.test(name);
}
