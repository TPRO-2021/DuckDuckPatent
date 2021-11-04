import { Module } from '@nestjs/common';
import { PatentsController } from './patents.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PatentsService } from './patents.service';
import { ImagesModule } from './images/images.module';

@Module({
    imports: [HttpModule, ConfigModule.forRoot(), ImagesModule],
    controllers: [PatentsController],
    providers: [PatentsService],
})
export class PatentsModule {}
