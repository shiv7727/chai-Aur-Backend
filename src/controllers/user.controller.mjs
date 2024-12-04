import joi from "joi";
import { User } from "../models/user.model.mjs";
import { ApiResponse } from "../utils/ApiResponse.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import { ApiError } from "../utils/ApiError.mjs";
import { uploadOnCloudinary } from "../utils/cloudinary.mjs";

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
    throw new ApiError(400, error.details[0].message);
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
  const accessToken = createdUser.generateAccessToken();

  const user = await User.findById(createdUser._id).select(
    "-password -refreshToken -__v"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user, accessToken },
        "User created successfully",
        true
      )
    );
});

export { registerUser };
