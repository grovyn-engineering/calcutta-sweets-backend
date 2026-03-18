import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}
    async signIn(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findFirst({
            where: {
                email: email,
            },
        });
        if (user?.password !== pass) {
          throw new UnauthorizedException();
        }
        const { password, ...result } = user;
        return result;
      }
}
