"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.logUserActivity = exports.deleteUser = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateUser = exports.getUser = exports.login = exports.signinWithGoogle = exports.signup = void 0;
const util_1 = __importDefault(require("util"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_2 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const email_1 = __importDefault(require("../utils/email"));
const Environment_1 = require("../Environment");
const customError_1 = __importDefault(require("../utils/customError"));
const userModel_1 = require("../models/userModel");
const asyncErrorHandler_1 = __importDefault(require("../utils/asyncErrorHandler"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const userActivityModel_1 = __importDefault(require("../models/userActivityModel"));
// const createSendResponse = (user, statusCode, res) => {
//   const accessToken = signToken(user._id, user.email);
//   // Creates Secure Cookie with access token
//   const cookieOptions = {
//     httpOnly: true, //do not allow browser to modify cookie (cross site scripting attack)
//     // secure: process.env.NODE_ENV === "production", // secure cookies in production // https only
//     maxAge: process.env.LOGIN_EXP,
//     // sameSite: "strict", // Adjust based on your needs, e.g., 'lax', 'strict', 'none'
//     //    maxAge: 24 * 60 * 60 * 1000
//   };
//   res.cookie("jwt", accessToken, cookieOptions);
//   user.password = undefined;
//   res.status(statusCode).json({
//     status: "success",
//     accessToken,
//     data: {
//       user,
//     },
//   });
// };
const signToken = (id, email) => jsonwebtoken_1.default.sign({ id, userEmail: email }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXP,
});
exports.signup = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const requestData = req.body;
    const { email, emailConfirm, password, passwordConfirm } = requestData;
    console.log("SIGN UP REQ:", JSON.stringify(req.body));
    if (email !== emailConfirm) {
        const error = new customError_1.default("Emails do not match", 400);
        return next(error);
    }
    if (password !== passwordConfirm) {
        const error = new customError_1.default("Passwords do not match.", 400);
        return next(error);
    }
    else if (password.length > 15) {
        const error = new customError_1.default("Password should have less than 15 characters.", 400);
        return next(error);
    }
    // check for duplicate usernames in the db
    const duplicate = await userModel_1.UserModel.findOne({ email: email }).exec();
    if (duplicate) {
        const error = new customError_1.default("User already exists.", 409);
        return next(error);
    } //Conflict
    const saltRounds = 10;
    const hash = await bcrypt_1.default.hash(password.toString(), saltRounds);
    let newUser = await userModel_1.UserModel.create({
        ...req.body,
        password: hash,
        transactionTags: ["geral"],
    });
    await (0, exports.logUserActivity)("signUp", newUser, req);
    const token = signToken(String(newUser._id), newUser.email);
    newUser.password = undefined;
    // Creates Secure Cookie with access token
    // most modern browsers do require the secure: true attribute when sameSite: "none" is set in cookie options. This
    // requirement is part of an effort to enhance security and privacy by ensuring that cookies sent with cross-site
    // requests are only transmitted over secure (HTTPS) connections.
    // const cookieOptions: CookieOptions = {
    //   sameSite: "none",
    //   maxAge: 24 * 60 * 60 * 1000,
    //   //   httpOnly: true, //do not allow browser to modify cookie (cross site scripting attack)
    //   // secure: true, //https only
    //   // maxAge: process.env.LOGIN_EXP,
    // };
    // res.cookie("jwt", token, cookieOptions);
    // console.log("Response Headers:", res.getHeaders());
    res.status(201).json({
        status: "success",
        token,
        user: newUser,
    });
});
exports.signinWithGoogle = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    let token;
    const { clientId, credential } = req.body;
    const client = new google_auth_library_1.OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
    });
    const { name, email, picture } = ticket.getPayload();
    // check for duplicate usernames in the db
    const user = await userModel_1.UserModel.findOne({ email: email }).exec();
    if (user) {
        token = signToken(String(user._id), user.email);
        await (0, exports.logUserActivity)("signUp-with-google", user, req);
        return res.status(200).json({
            status: "success",
            token,
            user: user,
        });
    }
    const password = crypto_1.default
        .randomBytes(12)
        .toString("base64")
        .replace(/[+/=]/g, "");
    const saltRounds = 10;
    const hash = await bcrypt_1.default.hash(password.toString(), saltRounds);
    let newUser = await userModel_1.UserModel.create({
        email,
        password: hash,
        signedUpByGoogle: true,
        transactionTags: ["geral"],
    });
    await (0, exports.logUserActivity)("signUp-with-google", newUser, req);
    token = signToken(String(newUser._id), newUser.email);
    newUser.password = undefined;
    return res.status(200).json({
        status: "success",
        token,
        user: user,
        newUser: true,
    });
});
exports.login = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    // console.log("LOGIN DATA: ", req.body)
    const { email, password } = req.body;
    if (!email || !password) {
        const error = new customError_1.default("Please provide a valid email and password.", 400);
        return next(error);
    }
    let user = await userModel_1.UserModel.findOne({ email }).select("+password");
    //In the userSchema, the password field has the select: false property to hide the password from the getAll request
    // const isMatch = await user.comparePassword(password, user.password) ; // Wrong approach: if there is no user it will throw an error
    if (!user ||
        !(await user.comparePassword(String(password), user.password))) {
        const error = new customError_1.default("Invalid email or password.", 401);
        return next(error);
    }
    await (0, exports.logUserActivity)("login", user, req);
    const token = signToken(String(user._id), user.email);
    user.password = undefined;
    res.status(200).json({
        status: "success",
        token,
        user,
    });
});
exports.getUser = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const tenantId = req.tenantId;
    const user = await userModel_1.UserModel.findById(tenantId).exec();
    if (!user) {
        const error = new customError_1.default("User not found", 404);
        return next(error);
    }
    res.status(200).json({
        status: "success",
        user,
    });
});
exports.updateUser = (0, asyncErrorHandler_1.default)(
//CURRENTLY BEING USED ONLY FOR CREATING USER TAGS
async (req, res, next) => {
    const tenantId = req.tenantId;
    const notAllowedToUpdate = req.body?.passwordResetToken;
    if (notAllowedToUpdate) {
        const error = new customError_1.default("Not allowed to update that field.", 403);
        return next(error);
    }
    console.log("REQ. BODY: ", req.body);
    const updatedUser = await userModel_1.UserModel.findByIdAndUpdate(tenantId, req.body, { new: true, runValidators: true } // Options: return the updated user and run validators
    );
    if (!updatedUser) {
        const error = new customError_1.default("User not found.", 404);
        return next(error);
    }
    res.status(200).json({
        status: "success",
        user: updatedUser,
    });
});
exports.changePassword = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const { tenantId, userPassword } = req;
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
        const error = new customError_1.default("Check request fields.", 500);
        return next(error);
    }
    const checkOldPassword = await bcrypt_1.default.compare(oldPassword.toString(), userPassword);
    if (!checkOldPassword) {
        const error = new customError_1.default("Old Password does not match.", 401);
        return next(error);
    }
    if (newPassword !== newPasswordConfirm) {
        const error = new customError_1.default("Passwords do not match.", 400);
        return next(error);
    }
    else if (newPassword.length > 15) {
        const error = new customError_1.default("Password should have less than 15 characters.", 400);
        return next(error);
    }
    const saltRounds = 10;
    const hash = await bcrypt_1.default.hash(newPassword.toString(), saltRounds);
    // Find the user by their ID and update field
    const updatedUser = await userModel_1.UserModel.findByIdAndUpdate(tenantId, // The user's ID
    { password: hash, passwordChangedAt: new Date() }, { new: true, runValidators: true } // Options: return the updated user and run validators
    );
    if (!updatedUser) {
        const error = new customError_1.default("User not found.", 404);
        return next(error);
    }
    const token = signToken(String(tenantId), updatedUser.email);
    res.status(200).json({
        status: "success",
        token,
        user: updatedUser,
    });
});
exports.forgotPassword = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const email = req.body.email;
    //This front end url is not valid for postman requests:
    const frontendUrl = process.env.NODE_ENV === "production"
        ? "https://equilibriofinanceiro.web.app"
        : "http://localhost:5173";
    // const frontendUrl = req.get("origin") || req.get("referer");
    if (!email) {
        const error = new customError_1.default("Please provide a valid email.", 400);
        return next(error);
    }
    const user = await userModel_1.UserModel.findOne({ email: req.body.email });
    if (!user) {
        const error = new customError_1.default("User with given email is not found!", 404);
        return next(error);
    }
    if (user.passwordResetToken &&
        user?.passwordResetTokenExpires > Date.now()) {
        const error = new customError_1.default("Wait 10 minutes before requesting a new token.", 429);
        return next(error);
    }
    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${frontendUrl}/resetPassword/${user._id}/${resetToken}`;
    const message = `
    <h1>${Environment_1.Environment.APP_NAME}</h1>
    <h5>Redefinição de senha</h5>
    <p>Caso tenha esquecido sua senha, clique no botão abaixo para ir para a página de redefinição de senha:</p>
    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
      Redefinir senha
    </a>
    <p>Esta solicitação é válida por 10 minutos.</p>
  `;
    const textVersion = `
    Caso tenha solicitado redefinição de senha, copie e cole o link abaixo no seu navegador:\n
    ${resetUrl}\n
    Solicitação válida por 10 minutos.
  `;
    try {
        await (0, email_1.default)({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Redefinição de senha",
            text: textVersion,
            html: message,
        });
        res.status(200).json({
            status: "success",
            message: "Password reset link sent to the user email.",
        });
    }
    catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({ validateBeforeSave: false });
        return next(new customError_1.default("There was an error sending password reset link", 500));
    }
});
exports.resetPassword = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const id = req.params.id;
    const token = (0, crypto_2.createHash)("sha256").update(req.params.token).digest("hex");
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    if (password !== passwordConfirm) {
        const error = new customError_1.default("Passwords do not match.", 400);
        return next(error);
    }
    else if (password.length > 15) {
        const error = new customError_1.default("Password should less than or equal to 15 characters.", 400);
        return next(error);
    }
    const user = await userModel_1.UserModel.findOne({
        _id: id,
        passwordResetToken: token,
        passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
        const error = new customError_1.default("Token expired or invalid.", 401);
        return next(error);
    }
    const saltRounds = 10;
    const hash = await bcrypt_1.default.hash(password.toString(), saltRounds);
    user.password = hash;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save({ validateBeforeSave: false });
    const newToken = signToken(String(user._id), user.email);
    user.password = undefined;
    res.status(200).json({
        status: "success",
        token: newToken,
        user,
    });
});
exports.deleteUser = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const tenantId = req.tenantId;
    const deletedUser = await userModel_1.UserModel.findByIdAndDelete(tenantId);
    if (!deletedUser) {
        const error = new customError_1.default("User with given ID is not found!", 404);
        return next(error);
    }
    await transactionModel_1.default.deleteMany({ tenantId });
    await (0, exports.logUserActivity)("signOff", deletedUser, req);
    res.status(204).json({
        status: "success",
        data: null,
    });
});
const logUserActivity = async (action, user, req) => {
    const { _id, email } = user;
    const ipAddress = req?.ip;
    try {
        const userActivity = await userActivityModel_1.default.create({
            action,
            userEmail: email,
            tenantId: _id,
            createdAt: new Date(),
            ipAddress,
        });
        console.log("User activity logged: ", userActivity);
    }
    catch (error) {
        console.log("Not Able to log user activity on server", error);
    }
};
exports.logUserActivity = logUserActivity;
exports.protect = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    // console.log("TOKEN: ", token);
    // 1. Read the token from cookies
    // console.log("COOKIE: ", req.cookies);
    // if (req.cookies.jwt) {
    //   token = req.cookies.jwt;
    // }
    // 1.Read the token and check if it exist:
    let token = req.headers.authorization;
    // console.log("REQ HEADERS TOKEN: ", token);
    if (!token) {
        return next(new customError_1.default("User not authorized, access token not found.", 401));
    }
    if (token && token.startsWith("bearer")) {
        token = token.split(" ")[1];
        // console.log("Token string: ", token);
    }
    // 2.Validate the token:
    // console.log("SECRET STR: ", process.env.SECRET_STR);
    const decodedToken = await util_1.default.promisify(jsonwebtoken_1.default.verify)(token, process.env.SECRET_STR);
    // console.log("DECODED TOKEN: ", decodedToken);
    // 3. Check if user exists, and was not deleted recently:
    const user = await userModel_1.UserModel.findById(decodedToken.id).select("+password");
    if (!user) {
        return next(new customError_1.default("User with given access token was not found.", 404));
    }
    //Pass user information forward to next middleware
    req.userEmail = user.email;
    req.tenantId = decodedToken.id;
    req.userPassword = user.password;
    // 4. Check if pwd was changed after token was issued:
    if (user.isPasswordChanged(decodedToken.iat)) {
        return next(new customError_1.default("Password was changed, please try to log in again.", 401));
    }
    // 5. Allow user to access the route:
    next();
});
//# sourceMappingURL=authController.js.map