import { Patent } from '@/models/Patent';

export default class PatentService {
    public async get(searchTerms: string[]): Promise<Patent[]> {
        const queryString = searchTerms.map((term) => `keywords=${term}`).join('&');
        const response = await fetch(`http://localhost:3000/patents?${queryString}`);
        return response.json() as Promise<Patent[]>;
    }
}
