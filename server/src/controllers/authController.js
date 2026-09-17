import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

import {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
} from '../utils/tokens.js';

/*
|--------------------------------------------------------------------------
| Validation schemas
|--------------------------------------------------------------------------
*/

/*
  Allowed username characters:
  - letters
  - numbers
  - underscore
  - dot
  - hyphen

  Examples:
  john
  john_123
  john.doe
  john-doe
*/
const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),

  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Username can only contain letters, numbers, dots, underscores, and hyphens'
    ),

  displayName: z
    .string()
    .trim()
    .max(80, 'Display name must be at most 80 characters')
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(1, 'Password is required'),
});

/*
|--------------------------------------------------------------------------
| Cookie configuration
|--------------------------------------------------------------------------
*/

const cookieName = 'refresh_token';

const cookieOptions = () => ({
  httpOnly: true,

  secure: process.env.COOKIE_SECURE === 'true',

  sameSite: process.env.COOKIE_SAME_SITE || 'lax',

  path: '/api/auth',

  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/*
|--------------------------------------------------------------------------
| Helper functions
|--------------------------------------------------------------------------
*/

function publicUser(user) {
  return {
    _id: user._id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
  };
}

/*
  Converts Zod validation errors into a simple readable message.
*/
function getValidationMessage(error) {
  if (error?.issues?.length) {
    return error.issues[0].message;
  }

  return 'Invalid request data';
}

/*
|--------------------------------------------------------------------------
| Refresh token handling
|--------------------------------------------------------------------------
*/

async function issueRefresh(user, res) {
  const jti = randomUUID();

  const token = signRefreshToken(user, jti);

  await RefreshToken.create({
    userId: user._id,

    tokenHash: hashToken(token),

    jti,

    expiresAt: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ),
  });

  res.cookie(
    cookieName,
    token,
    cookieOptions()
  );

  return signAccessToken(user);
}

/*
|--------------------------------------------------------------------------
| SIGNUP
|--------------------------------------------------------------------------
*/

export async function signup(req, res, next) {
  try {
    const data = signupSchema.parse(req.body);

    const email = data.email.toLowerCase();

    const username = data.username.toLowerCase();

    /*
      Check for existing email or username.
    */
    const existingUser = await User.exists({
      $or: [
        { email },
        { username },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email or username already exists',
      });
    }

    /*
      Hash password.
    */
    const passwordHash = await bcrypt.hash(
      data.password,
      12
    );

    /*
      Generate simulated email verification token.
    */
    const verification = randomToken();

    /*
      Create user.
    */
    const user = await User.create({
      email,

      passwordHash,

      username,

      displayName:
        data.displayName || username,

      verificationTokenHash:
        hashToken(verification),

      verificationExpiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    /*
      Issue refresh + access tokens.
    */
    const accessToken = await issueRefresh(
      user,
      res
    );

    return res.status(201).json({
      user: publicUser(user),

      accessToken,

      /*
        Verification token is returned only
        during local development.
      */
      verificationToken:
        process.env.NODE_ENV === 'production'
          ? undefined
          : verification,

      message:
        'Verification simulated; use the returned token in /verify-email during local development.',
    });
  } catch (error) {
    /*
      Handle Zod validation errors cleanly.
    */
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: getValidationMessage(error),
      });
    }

    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
*/

export async function verifyEmail(req, res, next) {
  try {
    const token = req.body?.token;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token required',
      });
    }

    const user = await User.findOne({
      verificationTokenHash: hashToken(token),

      verificationExpiresAt: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          'Invalid or expired verification token',
      });
    }

    user.emailVerified = true;

    user.verificationTokenHash = null;

    user.verificationExpiresAt = null;

    await user.save();

    return res.json({
      message: 'Email verified',

      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const email = data.email.toLowerCase();

    const user = await User.findOne({
      email,
    });

    if (
      !user ||
      !(await bcrypt.compare(
        data.password,
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    /*
      Token rotation:
      issue a new refresh token every login.
    */
    const accessToken = await issueRefresh(
      user,
      res
    );

    return res.json({
      user: publicUser(user),

      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: getValidationMessage(error),
      });
    }

    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| REFRESH TOKEN
|--------------------------------------------------------------------------
*/

export async function refresh(req, res, next) {
  try {
    const oldToken =
      req.cookies?.[cookieName];

    if (!oldToken) {
      return res.status(401).json({
        message: 'Refresh token required',
      });
    }

    /*
      Verify JWT.
    */
    const decoded = jwt.verify(
      oldToken,
      process.env.JWT_REFRESH_SECRET
    );

    /*
      Find the exact refresh token.
    */
    const record =
      await RefreshToken.findOne({
        jti: decoded.jti,

        tokenHash: hashToken(oldToken),

        revokedAt: null,
      });

    if (!record) {
      return res.status(401).json({
        message:
          'Refresh token revoked or invalid',
      });
    }

    /*
      Revoke old token.
    */
    record.revokedAt = new Date();

    await record.save();

    /*
      Find user.
    */
    const user = await User.findById(
      decoded.sub
    );

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    /*
      Issue rotated refresh token.
    */
    const accessToken = await issueRefresh(
      user,
      res
    );

    return res.json({
      user: publicUser(user),

      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message:
        'Refresh token expired or invalid',
    });
  }
}

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export async function logout(req, res, next) {
  try {
    const token =
      req.cookies?.[cookieName];

    if (token) {
      await RefreshToken.updateOne(
        {
          tokenHash: hashToken(token),

          revokedAt: null,
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        }
      );
    }

    /*
      Remove refresh cookie.
    */
    res.clearCookie(cookieName, {
      ...cookieOptions(),

      maxAge: undefined,
    });

    return res.json({
      message: 'Logged out',
    });
  } catch (error) {
    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

export async function forgotPassword(
  req,
  res,
  next
) {
  try {
    const email = z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .parse(req.body?.email)
      .toLowerCase();

    const user = await User.findOne({
      email,
    });

    /*
      Don't reveal whether account exists.
    */
    if (!user) {
      return res.json({
        message:
          'If the account exists, a reset token has been issued.',
      });
    }

    const token = randomToken();

    user.resetTokenHash =
      hashToken(token);

    user.resetExpiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await user.save();

    return res.json({
      message:
        'Reset token issued for local simulation.',

      resetToken:
        process.env.NODE_ENV === 'production'
          ? undefined
          : token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: getValidationMessage(error),
      });
    }

    next(error);
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

export async function resetPassword(
  req,
  res,
  next
) {
  try {
    const schema = z.object({
      token: z
        .string()
        .min(
          10,
          'Reset token is invalid'
        ),

      password: z
        .string()
        .min(
          8,
          'Password must be at least 8 characters'
        ),
    });

    const data = schema.parse(req.body);

    const user = await User.findOne({
      resetTokenHash:
        hashToken(data.token),

      resetExpiresAt: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          'Invalid or expired reset token',
      });
    }

    /*
      Update password.
    */
    user.passwordHash =
      await bcrypt.hash(
        data.password,
        12
      );

    /*
      Invalidate reset token.
    */
    user.resetTokenHash = null;

    user.resetExpiresAt = null;

    await user.save();

    /*
      Revoke all active refresh tokens.
      User must log in again.
    */
    await RefreshToken.updateMany(
      {
        userId: user._id,

        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );

    return res.json({
      message:
        'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: getValidationMessage(error),
      });
    }

    next(error);
  }
}