import { Controller, Get, Query } from '@nestjs/common';
import { KeywordService } from './keyword.service';

@Controller('keyword')
export class KeywordController {
    constructor(private readonly keywordService: KeywordService) {}

    @Get('')
    query(@Query() query): string[] {
        let { keywords } = query;

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        return this.keywordService.getSuggestions(keywords);
    }
}
