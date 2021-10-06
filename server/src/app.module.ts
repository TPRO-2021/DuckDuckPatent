import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MockPatentsService } from './mock-patents.service';

@Module({
    imports: [],
    controllers: [AppController],
    providers: [AppService, MockPatentsService],
})
export class AppModule {}
