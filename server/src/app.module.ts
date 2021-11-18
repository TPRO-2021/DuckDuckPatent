import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatentsModule } from './patents/patents.module';
import { KeywordModule } from './keyword/keyword.module';

/**
 * This module is responsible for adding all modules to the application
 */
@Module({
    imports: [PatentsModule, KeywordModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
