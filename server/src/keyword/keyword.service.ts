import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { SuggestionAPIResponse } from '../models';

const mockKeywords: SuggestionAPIResponse = [
    ['grain', 0.5],
    ['grains', 0.5],
    ['bread', 0.4],
    ['breads', 0.4],
    ['hunger', 0.3],
    ['hungers', 0.3],
    ['water', 0.5],
    ['waters', 0.5],
    ['man', 0.5],
    ['men', 0.5],
    ['glass', 0.8],
    ['glasses', 0.8],
    ['gol', 0.7],
    ['goles', 0.7],
    ['duck', 0.2],
    ['duckes', 0.2],
];

// How many keywords we want to return
const MAX_KEYWORDS = 6;

@Injectable()
export class KeywordService {
    constructor(private readonly httpService: HttpService) {}

    /* Get suggestions for terms */
    async getSuggestions(keywords: string[] = []): Promise<string[]> {
        // The number of suggestions that we should display should be tempered by the number of keywords given
        // This is a simple algorithm, but we could reach for complex ones later as needed
        const number = Math.max(3, MAX_KEYWORDS - keywords.length);

        // Wrapping all requests up in Promise.all allows all of the requests to run simultaneously
        // and only return when done
        const r = await Promise.all(
            keywords
                .filter((t) => t) // Filter out null, 0, and empty string
                .map((word) => {
                    // We're defaulting to english for now, but that could change in the future
                    const url = `${process.env.SUGGESTIONS_API_URL}/similarities?word=${word}&number=${number}&language=en`;

                    // Return that in a promise the last value from the request stream, return that in a promise
                    return lastValueFrom(this.httpService.get<SuggestionAPIResponse>(url))
                        .then((t) => t.data)
                        .catch((error) => {
                            // Calls to this API might fail

                            // Check if we're in Production, if so we need to just fail - showing mock results is no-go!
                            if (process.env.NODE_ENV === 'production') {
                                // Rethrowing the error breaks out of the catch block
                                throw error;
                            }
                            console.log('Error calling Suggestion API:', error && error.message, url);
                            // In development, it might not make sense to always be running the suggestion API
                            // because it requires quite a bit of RAM + CPU.
                            // Therefore we return mock results so that the UI can still be developed
                            return mockKeywords;
                        });
                }),
        );

        // Here we combine all the returned arrays, and flatten the results into a object/map
        const flattenedResults = r
            .reduce((a, b) => [...a, ...b], []) // Combine into one big array
            .reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {}); // Remove duplicates by smashing into a map
        const suggestions = Object.keys(flattenedResults) // Get the terms (the keys of the map)
            .sort((a, b) => flattenedResults[b] - flattenedResults[a]) // Sort in descending order
            .filter((t) => !keywords.includes(t))
            .filter((word) => !word.match('[^s](s|es)$')); // filter plurals of nouns from the suggestion API
        /**
         * After the suggestion keywords are added to the search the new suggestion keywords appears
         */
        const filtered = suggestions.slice(0, MAX_KEYWORDS).filter((t) => {
            const similar = keywords.filter((keyword) => t.match(`\b${keyword}\b`)); //\w*(men)(s|es)\b
            return similar.length === 0;
        });
        if (filtered.length < MAX_KEYWORDS) {
            return filtered.concat(suggestions.slice(MAX_KEYWORDS, MAX_KEYWORDS + MAX_KEYWORDS - filtered.length));
        }

        return filtered;
    }
}
