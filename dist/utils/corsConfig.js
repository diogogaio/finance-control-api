"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOrigin = void 0;
const setOrigin = () => {
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
exports.setOrigin = setOrigin;
//# sourceMappingURL=corsConfig.js.map