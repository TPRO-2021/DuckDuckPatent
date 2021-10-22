import { Patent } from '@/models/Patent';

export default class PatentService {
    public async get(searchTerms: string[]): Promise<Patent[]> {
        const queryString = searchTerms.map((term) => `keywords=${term}`).join('&');
        const response = await fetch(`http://localhost:3000/patents?${queryString}`);

        let json;

        try {
            json = (await response.json()) as Promise<Patent[]>;
        } catch (e) {
            // TODO: Throw a meaningful error and display the message in the corresponding view
            console.error(e);
            json = [];
        }
        return json;
    }

    // TODO: check with Samu if it does what's expected
    public async getSinglePatent(searchedID: string[]): Promise<Patent> {
        const queryString = searchedID.map((term) => `id=${term}`).join('&');
        const response = await fetch(`http://localhost:3000/patents?${queryString}`);
        return response.json() as Promise<Patent>;
    }
}
