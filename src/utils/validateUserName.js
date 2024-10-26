export function validateUserName(name) {
  const nameRegex = /^[ a-zA-ZÀ-ÿñÑ0-9!@#\$%\^\&*\)\(+=._-·?¿¡]+$/g;

  return nameRegex.test(name);
}
