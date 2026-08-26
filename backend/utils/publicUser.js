export const publicUser = (user) => {
  const { password, verificationToken, resetPasswordToken, ...rest } =
    user._doc || user;
  return rest;
};
