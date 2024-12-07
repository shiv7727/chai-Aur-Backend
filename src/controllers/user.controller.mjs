import joi from "joi";
import { User } from "../models/user.model.mjs";
import { ApiResponse } from "../utils/ApiResponse.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import { ApiError } from "../utils/ApiError.mjs";
import { uploadOnCloudinary } from "../utils/cloudinary.mjs";
import { removeTempFile } from "../utils/fileUtils.mjs";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: true });

  return {
    accessToken,
    refreshToken,
  };
};

const registerUser = asyncHandler(async (req, res, next) => {
  // step 1 get user details from request body
  // step 2  validate user details
  // step 3 check if user already exists : username , email
  // step 4 check for image  and check for avatar
  // step 5 upload the image to cloudinary
  // step 6 save user in db
  // step 7 check for user creation  status
  // step 8 generate token
  // step 9 send response

  const userValidationSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    fullName: joi.string().required(),
    avatar: joi.string().optional(),
    coverImage: joi.string().optional(),
    password: joi.string(),
  });
  const { error } = userValidationSchema.validate(req.body);
  if (error) {
    // Remove files if they were uploaded before validation error
    if (req.files?.avatar?.[0]?.path) {
      removeTempFile(req.files.avatar[0]?.path);
    }
    if (req.files?.coverImage?.[0]?.path) {
      removeTempFile(req.files.coverImage[0]?.path);
    }
    throw new ApiError(400, "Validation failed", error.details[0].message);
  }
  const { username, email } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User with given email or username  already exists"
    );
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload image on cloudinary");
  }

  const createdUser = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName: req.body.fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password: req.body.password,
  });

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  const user = await User.findById(createdUser._id).select(
    "-password -refreshToken -__v"
  );

  return res
    .status(201)
    .json(new ApiResponse(200, user, "User created successfully", true));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body-> email , username , password
  // find the user based on email or username and password
  //  find the user
  //  check password
  // access and refresh token
  // send cookies
  // send response

  const { email, username, password } = req.body;

  const userValidation = joi
    .object({
      email: joi.string().email().optional(),
      username: joi.string().optional(),
      password: joi.string().required(),
    })
    .xor("email", "username");

  const { errors } = userValidation.validate(req.body);

  if (errors) {
    throw new ApiError(400, "Validation Failed", errors.details[0].message);
  }
  const user = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (!user) {
    throw new ApiError(401, null, "Invalid username or password");
  }
  const isPasswordValid = await user.isPasswordCoreect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, null, "Inavlid credentails");
  }
  const updatedUser = await generateAccessTokenAndRefreshToken(user._id);
  const newUser = await User.findById(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", updatedUser.accessToken, options)
    .cookie("refreshToken", updatedUser.refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: newUser,
          accessToken: updatedUser.accessToken,
          refreshToken: updatedUser.refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear cookies
  // remove refresh token from db
  // send response
  const options = {
    httpOnly: true,
    secure: true,
  };
  const user = req.user;
  await User.findByIdAndUpdate(user._id, {
    $set: { refreshToken: undefined },
  });
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log(req.cookies.refreshToken);
  console.log(req.cookies.accessToken);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized rquest");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token ");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "refresh token is expired or invalid");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token ");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
