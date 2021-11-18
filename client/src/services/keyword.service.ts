/**
 * Service which provides functions to access keyword resources.
 */
export default class KeywordService {
    /**
     * Gets keyword suggestions from the server for the passed keywords
     *
     * @param keywords  The keywords which should be used as a base for the suggestions
     */
    public async getSuggestions(keywords: string[]): Promise<string[]> {
        const response = await fetch(`/api/keyword?${keywords}`, { method: 'GET' });
        const suggestion = (await response.json()) as string[];

        return suggestion.filter((value) => {
            return keywords.indexOf(value) === -1;
        });
    }
}
