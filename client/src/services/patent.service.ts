import { Patent } from '@/models/Patent';

export default class PatentService {
    public async get(searchTerms: string[]): Promise<Patent[]> {
        let queryString = '';
        searchTerms.forEach((term, index) => {
            if (index === 0) {
                queryString = `keywords=${term}`;
                return;
            }

            queryString += `&keywords=${term}`;
        });

        const response = await fetch(`http://localhost:3000/patents?${queryString}`, { method: 'GET' });
        return (await response.json()) as Patent[];
    }
}
