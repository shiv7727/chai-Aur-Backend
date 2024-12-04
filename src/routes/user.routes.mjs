import Router from "express";
import { registerUser } from "../controllers/user.controller.mjs";
import { upload } from "../middlewares/multer.middleware.mjs";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

export default router;
