import Router from "express";
import { logoutUser, registerUser } from "../controllers/user.controller.mjs";
import { upload } from "../middlewares/multer.middleware.mjs";
import { verifyJWT } from "../middlewares/Auth.middleware.mjs";
import { loginUser } from "../controllers/user.controller.mjs";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
