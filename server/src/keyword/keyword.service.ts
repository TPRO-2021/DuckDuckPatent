import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { SuggestionAPIResponse } from '../models';

const mockKeywords: SuggestionAPIResponse = [
    ['grain', 0.5],
    ['water', 0.5],
    ['bread', 0.4],
    ['hunger', 0.3],
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
                            if (process.env.NODE_ENV === 'production' || error.message.includes('500')) {
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

        return Object.keys(flattenedResults) // Get the terms (the keys of the map)
            .sort((a, b) => flattenedResults[b] - flattenedResults[a]) // Sort in descending order
            .map((word) => word.toLowerCase()) // if the API AI returns first letter or the whole word capital letters to convert to lower case
            .filter((t) => !keywords.includes(t.toLowerCase())) //remove from suggestion the UPPER searched keyword
            .filter((word) => !word.match('[^s](s|es)$')) // filter plurals of nouns from the suggestion API
            .slice(0, MAX_KEYWORDS);
    }
}
