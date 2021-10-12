import { Module } from '@nestjs/common';
import { KeywordController } from './keyword.controller';
import { KeywordService } from './keyword.service';

@Module({
    controllers: [KeywordController],
    providers: [KeywordService],
})
export class KeywordModule {}
