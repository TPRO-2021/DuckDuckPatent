import { Module } from '@nestjs/common';
import { KeywordController } from './keyword.controller';
import { KeywordService } from './keyword.service';
import { HttpModule } from '@nestjs/axios';

/**
 * This module is responsible for the '/keyword' endpoint
 */
@Module({
    imports: [HttpModule],
    controllers: [KeywordController],
    providers: [KeywordService],
})
export class KeywordModule {}
