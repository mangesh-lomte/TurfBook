import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../common/utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../../common/utils/jwt.js';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../../common/errors/AppError.js';
import { Role } from '@prisma/client';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: Role;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  async register(data: RegisterDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const userRole = data.role === Role.OWNER ? Role.OWNER : Role.CUSTOMER;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone || null,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh session
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: data.userAgent?.slice(0, 255) || null,
        ipAddress: data.ipAddress?.slice(0, 45) || null,
        expiresAt,
      },
    });

    return { user, accessToken, refreshToken };
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh session
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: data.userAgent?.slice(0, 255) || null,
        ipAddress: data.ipAddress?.slice(0, 45) || null,
        expiresAt,
      },
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return { user: safeUser, accessToken, refreshToken };
  }

  async refreshToken(rawRefreshToken: string, userAgent?: string, ipAddress?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      // Possible token reuse or revoked session
      if (session) {
        await prisma.refreshSession.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Revoke old session (Rotation)
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    // Create new token pair
    const newTokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
    const newAccessToken = generateAccessToken(newTokenPayload);
    const newRefreshToken = generateRefreshToken(newTokenPayload);

    const newTokenHash = hashRefreshToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshSession.create({
      data: {
        userId: session.user.id,
        tokenHash: newTokenHash,
        userAgent: userAgent?.slice(0, 255) || null,
        ipAddress: ipAddress?.slice(0, 45) || null,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
      },
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      await prisma.refreshSession.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            venues: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
