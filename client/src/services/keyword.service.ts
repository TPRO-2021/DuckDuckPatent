export default class KeywordService {
    public async getSuggestions(keywords: string[]): Promise<string[]> {
        // TODO: Implement the fetching of keywords from the backend
        return ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5', 'keyword6'].filter((value) => {
            return keywords.indexOf(value) === -1;
        });
    }
}
