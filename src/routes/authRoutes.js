import { Router } from 'express';
import { celebrate } from 'celebrate';
import { registerUser, loginUser, refreshUserSession, logoutUser, requestResetEmail } from '../controllers/authController.js';
import { registerUserSchema, loginUserSchema, requestResetEmailSchema } from '../validations/authValidation.js';

const router = Router();

router.post('/register', celebrate(registerUserSchema), registerUser);
router.post('/login', celebrate(loginUserSchema), loginUser);
router.post('/refresh', refreshUserSession);
router.post('/logout', logoutUser);
router.post('/request-reset-email', celebrate(requestResetEmailSchema), requestResetEmail );

export default router;
