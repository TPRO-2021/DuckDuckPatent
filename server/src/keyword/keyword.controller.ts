import { Controller, Get, Query } from '@nestjs/common';
import { KeywordService } from './keyword.service';

/**
 * This controller registers the '/keyword' route and delegates the requests to the keyword service
 */
@Controller('keyword')
export class KeywordController {
    constructor(private readonly keywordService: KeywordService) {}

    /**
     * Route handler for querying keyword suggestions based on the provided keywords
     *
     * @param query The query containing the keywords for the suggestion
     */
    @Get('')
    query(@Query() query): Promise<string[]> {
        const keywords = (Object.keys(query)[0] || '').split(',');

        return this.keywordService.getSuggestions(keywords.map((k) => k.toLowerCase()));
    }
}
