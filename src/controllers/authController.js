import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js'

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteOne({ userId: user._id });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      throw createHttpError(401, 'Session not found');
    }

    const session = await Session.findOne({
      _id: sessionId,
      refreshToken,
    });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    const isSessionTokenExpired =
      new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
      await Session.deleteOne({ _id: sessionId });

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      };

      res.clearCookie('sessionId', cookieOptions);
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      throw createHttpError(401, 'Session token expired');
    }

    await Session.deleteOne({ _id: sessionId });

    const newSession = await createSession(session.userId);
    setSessionCookies(res, newSession);

    res.status(200).json({
      message: 'Session refreshed',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    res.clearCookie('sessionId', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
if (!user) {
    return res.status(200).json({
      message: 'If this email exists, a reset link has been sent',
    });
}


   const resetToken = jwt.sign(
    { sub: user._id, email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetToken}">here</a> to reset your password!</p>`,
    });
  } catch {
    throw createHttpError(500, 'Failed to send the email, please try again later.');
  }


  res.status(200).json({
	message: 'Password reset email sent successfully'
  });
};
