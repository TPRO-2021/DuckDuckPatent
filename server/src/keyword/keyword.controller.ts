import { Controller, Get, Query } from '@nestjs/common';
import { KeywordService } from './keyword.service';

@Controller('keyword')
export class KeywordController {
    constructor(private readonly keywordService: KeywordService) {}

    @Get('')
    query(@Query() query): Promise<string[]> {
        const keywords = (Object.keys(query)[0] || '').split(',');

        return this.keywordService.getSuggestions(keywords.map((k) => k.toLowerCase()));
    }
}
