export function toSafeUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user.toSafeObject === "function") {
    return user.toSafeObject();
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
