import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatentsModule } from './patents/patents.module';
import { KeywordModule } from './keyword/keyword.module';

@Module({
    imports: [PatentsModule, KeywordModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
