import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'echogpt_super_secret_access_jwt_key_2026',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      planTier: user.subscription?.planTier || 'FREE',
      sessionId: payload.sessionId,
    };
  }
}
