import { Module } from '@nestjs/common';
import { PatentsController } from './patents.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PatentsService } from './patents.service';

@Module({
    imports: [HttpModule, ConfigModule.forRoot()],
    controllers: [PatentsController],
    providers: [PatentsService],
})
export class PatentsModule {}
