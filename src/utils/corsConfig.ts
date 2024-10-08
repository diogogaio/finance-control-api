export const setOrigin = () => {
  const productionURLs = [
    "https://accounts.google.com",
    "https://equilibriofinanceiro.web.app", // Allow Google One Tap requests if needed
  ];

  const devUrls = [
    "https://accounts.google.com",
    "https://equilibriofinanceiro.web.app",
    "http://localhost:5173",
  ];

  return process.env.NODE_ENV === "production" ? productionURLs : devUrls;
};
