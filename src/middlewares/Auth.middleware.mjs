import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import { ApiError } from "../utils/ApiError.mjs";
import { User } from "../models/user.model.mjs";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized");
    }
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      throw new ApiError(500, "JWT_ACCESS_TOKEN_SECRET is not defined");
    }
    const decoded = jwt.verify(accessToken, secret);

    if (decoded && typeof decoded !== "string") {
      const user = await User.findById(decoded._id).select(
        "-password -refreshToken -__v"
      );

      if (!user) {
        throw new ApiError(401, "Unauthorized");
      }
      req.user = user;
      next();
    }
  } catch (error) {
    throw new ApiError(401, "Invalid access token");
  }
});
