export default class KeywordService {
    /**
     * Gets keyword suggestions from the server for the passed keywords
     * @param keywords
     */
    public async getSuggestions(keywords: string[]): Promise<string[]> {
        const response = await fetch(`http://localhost:3000/keyword?${keywords}`, { method: 'GET' });
        const suggestion = (await response.json()) as string[];
        return suggestion.filter((value) => {
            return keywords.indexOf(value) === -1;
        });
    }
}
