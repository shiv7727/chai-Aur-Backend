import { asyncHandler } from "../utils/asyncHandler.mjs";

const registerUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "User registered successfully",
  });
});

export { registerUser };
