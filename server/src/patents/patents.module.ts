import { Module } from '@nestjs/common';
import { MockPatentsService } from './patents.service.mock';
import { PatentsController } from './patents.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PatentsService } from './patents.service';

@Module({
    imports: [HttpModule, ConfigModule.forRoot()],
    controllers: [PatentsController],
    providers: [MockPatentsService, PatentsService],
})
export class PatentsModule {}
