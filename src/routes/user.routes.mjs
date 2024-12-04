import Router from "express";
import { registerUser } from "../controllers/user.controller.mjs";

const router = Router();

router.route("/register").post(registerUser);

export default router;
