import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatentsModule } from './patents/patents.module';

@Module({
    imports: [PatentsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
