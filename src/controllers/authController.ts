import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction /* CookieOptions */ } from "express";

import sendMail from "../utils/email";
import { Environment } from "../Environment";
import CustomError from "../utils/customError";
import { UserModel, IUser } from "../models/userModel";
import asyncErroHandler from "../utils/asyncErrorHandler";
import TransactionModel from "../models/transactionModel";
import UserActivityModel, { IUserActivity } from "../models/userActivityModel";

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userPassword: string;
      userEmail: string;
    }
  }
}

interface IUserSignUpData {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
}

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

const signToken = (id: string, email: string) =>
  jwt.sign({ id, userEmail: email }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXP,
  });

export const signup = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const requestData: IUserSignUpData = req.body;
    const { email, emailConfirm, password, passwordConfirm } = requestData;
    console.log("SIGN UP REQ:", JSON.stringify(req.body));
    if (email !== emailConfirm) {
      const error = new CustomError("Emails do not match", 400);
      return next(error);
    }

    if (password !== passwordConfirm) {
      const error = new CustomError("Passwords do not match.", 400);
      return next(error);
    } else if (password.length > 15) {
      const error = new CustomError(
        "Password should have less than 15 characters.",
        400
      );
      return next(error);
    }

    // check for duplicate usernames in the db
    const duplicate = await UserModel.findOne({ email: email }).exec();
    if (duplicate) {
      const error = new CustomError("User already exists.", 409);
      return next(error);
    } //Conflict

    const saltRounds = 10;
    const hash = await bcrypt.hash(password.toString(), saltRounds);
    let newUser = await UserModel.create({
      ...req.body,
      password: hash,
      transactionTags: ["geral"],
    });

    await logUserActivity("signUp", newUser, req);

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
  }
);

export const signinWithGoogle = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string;
    const { clientId, credential } = req.body;
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const { name, email, picture } = ticket.getPayload();

    // check for duplicate usernames in the db
    const user = await UserModel.findOne({ email: email }).exec();

    if (user) {
      token = signToken(String(user._id), user.email);
      await logUserActivity("signUp-with-google", user, req);
      return res.status(200).json({
        status: "success",
        token,
        user: user,
      });
    }

    const password = crypto
      .randomBytes(12)
      .toString("base64")
      .replace(/[+/=]/g, "");

    const saltRounds = 10;
    const hash = await bcrypt.hash(password.toString(), saltRounds);

    let newUser = await UserModel.create({
      email,
      password: hash,
      signedUpByGoogle: true,
      transactionTags: ["geral"],
    });

    await logUserActivity("signUp-with-google", newUser, req);

    token = signToken(String(newUser._id), newUser.email);

    newUser.password = undefined;

    return res.status(200).json({
      status: "success",
      token,
      user: user,
      newUser: true,
    });
  }
);

export const login = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // console.log("LOGIN DATA: ", req.body)
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new CustomError(
        "Please provide a valid email and password.",
        400
      );
      return next(error);
    }

    let user = await UserModel.findOne({ email }).select("+password");
    //In the userSchema, the password field has the select: false property to hide the password from the getAll request

    // const isMatch = await user.comparePassword(password, user.password) ; // Wrong approach: if there is no user it will throw an error

    if (
      !user ||
      !(await user.comparePassword(String(password), user.password))
    ) {
      const error = new CustomError("Invalid email or password.", 401);
      return next(error);
    }

    await logUserActivity("login", user, req);
    const token = signToken(String(user._id), user.email);

    user.password = undefined;

    res.status(200).json({
      status: "success",
      token,
      user,
    });
  }
);

export const getUser = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;

    const user = await UserModel.findById(tenantId).exec();

    if (!user) {
      const error = new CustomError("User not found", 404);
      return next(error);
    }

    res.status(200).json({
      status: "success",
      user,
    });
  }
);

export const updateUser = asyncErroHandler(
  //CURRENTLY BEING USED ONLY FOR CREATING USER TAGS
  async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;
    const notAllowedToUpdate = req.body?.passwordResetToken;

    if (notAllowedToUpdate) {
      const error = new CustomError("Not allowed to update that field.", 403);
      return next(error);
    }

    console.log("REQ. BODY: ", req.body);

    const updatedUser = await UserModel.findByIdAndUpdate(
      tenantId,
      req.body,
      { new: true, runValidators: true } // Options: return the updated user and run validators
    );

    if (!updatedUser) {
      const error = new CustomError("User not found.", 404);
      return next(error);
    }

    res.status(200).json({
      status: "success",
      user: updatedUser,
    });
  }
);

export const changePassword = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tenantId, userPassword } = req;
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      const error = new CustomError("Check request fields.", 500);
      return next(error);
    }

    const checkOldPassword = await bcrypt.compare(
      oldPassword.toString(),
      userPassword
    );

    if (!checkOldPassword) {
      const error = new CustomError("Old Password does not match.", 401);
      return next(error);
    }

    if (newPassword !== newPasswordConfirm) {
      const error = new CustomError("Passwords do not match.", 400);
      return next(error);
    } else if (newPassword.length > 15) {
      const error = new CustomError(
        "Password should have less than 15 characters.",
        400
      );
      return next(error);
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword.toString(), saltRounds);

    // Find the user by their ID and update field
    const updatedUser = await UserModel.findByIdAndUpdate(
      tenantId, // The user's ID
      { password: hash, passwordChangedAt: new Date() },
      { new: true, runValidators: true } // Options: return the updated user and run validators
    );

    if (!updatedUser) {
      const error = new CustomError("User not found.", 404);
      return next(error);
    }

    const token = signToken(String(tenantId), updatedUser.email);

    res.status(200).json({
      status: "success",
      token,
      user: updatedUser,
    });
  }
);

export const forgotPassword = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;

    //This front end url is not valid for postman requests:
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? "https://equilibriofinanceiro.web.app"
        : "http://localhost:5173";
    // const frontendUrl = req.get("origin") || req.get("referer");

    if (!email) {
      const error = new CustomError("Please provide a valid email.", 400);
      return next(error);
    }

    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      const error = new CustomError("User with given email is not found!", 404);
      return next(error);
    }

    if (
      user.passwordResetToken &&
      user?.passwordResetTokenExpires > Date.now()
    ) {
      const error = new CustomError(
        "Wait 10 minutes before requesting a new token.",
        429
      );
      return next(error);
    }

    const resetToken = user.createResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${frontendUrl}/resetPassword/${user._id}/${resetToken}`;

    const message = `
    <h1>${Environment.APP_NAME}</h1>
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
      await sendMail({
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
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      user.save({ validateBeforeSave: false });
      return next(
        new CustomError("There was an error sending password reset link", 500)
      );
    }
  }
);

export const resetPassword = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const token = createHash("sha256").update(req.params.token).digest("hex");
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    if (password !== passwordConfirm) {
      const error = new CustomError("Passwords do not match.", 400);
      return next(error);
    } else if (password.length > 15) {
      const error = new CustomError(
        "Password should less than or equal to 15 characters.",
        400
      );
      return next(error);
    }

    const user = await UserModel.findOne({
      _id: id,
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      const error = new CustomError("Token expired or invalid.", 401);
      return next(error);
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password.toString(), saltRounds);

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
  }
);

export const deleteUser = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;
    const deletedUser = await UserModel.findByIdAndDelete(tenantId);

    if (!deletedUser) {
      const error = new CustomError("User with given ID is not found!", 404);
      return next(error);
    }

    await TransactionModel.deleteMany({ tenantId });

    await logUserActivity("signOff", deletedUser, req);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const logUserActivity = async (
  action: IUserActivity["action"],
  user: IUser,
  req: any
) => {
  const { _id, email } = user;
  const ipAddress = req?.ip;

  try {
    const userActivity = await UserActivityModel.create({
      action,
      userEmail: email,
      tenantId: _id,
      createdAt: new Date(),
      ipAddress,
    });
    console.log("User activity logged: ", userActivity);
  } catch (error) {
    console.log("Not Able to log user activity on server", error);
  }
};

export const protect = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
      return next(
        new CustomError("User not authorized, access token not found.", 401)
      );
    }

    if (token && token.startsWith("bearer")) {
      token = token.split(" ")[1];
    }
    // 2.Validate the token:

    // console.log("SECRET STR: ", process.env.SECRET_STR);

    const decodedToken = jwt.verify(token, process.env.SECRET_STR as string);

    if (typeof decodedToken === "string") {
      return next(new CustomError("Failed to verify token", 500));
    }

    // console.log("DECODED TOKEN: ", decodedToken);

    // 3. Check if user exists, and was not deleted recently:

    const user = await UserModel.findById(decodedToken.id).select("+password");

    if (!user) {
      return next(
        new CustomError("User with given access token was not found.", 404)
      );
    }

    //Pass user information forward to next middleware
    req.userEmail = user.email;
    req.tenantId = decodedToken.id;
    req.userPassword = user.password;

    // 4. Check if pwd was changed after token was issued:

    if (user.isPasswordChanged(decodedToken.iat)) {
      return next(
        new CustomError(
          "Password was changed, please try to log in again.",
          401
        )
      );
    }

    // 5. Allow user to access the route:
    next();
  }
);
