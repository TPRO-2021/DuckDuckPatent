import { Injectable } from '@nestjs/common';

const mockKeywords = ['grain', 'water', 'bread', 'hunger'];

@Injectable()
export class KeywordService {
    getSuggestions(keywords: string[] = []): any[] {
        // TODO: Implement the fetching of keywords from the backend
        return mockKeywords;
    }
}
