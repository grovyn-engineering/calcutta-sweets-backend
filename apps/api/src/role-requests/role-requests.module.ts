import { Module } from '@nestjs/common';
import { RoleRequestsService } from './role-requests.service';
import { RoleRequestsController } from './role-requests.controller';
import { PrismaModule } from '../prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, EmailModule, AuthModule],
    controllers: [RoleRequestsController],
    providers: [RoleRequestsService],
    exports: [RoleRequestsService],
})
export class RoleRequestsModule { }
