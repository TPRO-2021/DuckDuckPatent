import { Module } from '@nestjs/common';
import { MockPatentsService } from './patents.service.mock';
import { PatentsController } from './patents.controller';

@Module({
    controllers: [PatentsController],
    providers: [MockPatentsService],
})
export class PatentsModule {}
