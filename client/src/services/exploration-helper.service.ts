import { Patent } from '@/models/Patent';

export default class ExplorationHelperService {
    /**
     * adapted from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
     * Shuffles array in place. ES6 version
     * @param a items   An array containing the items.
     */
    public static shuffle<T>(a: T[]): T[] {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Returns a single patent array containing the content from the passed collection
     * @param patentsCollection
     */
    public static getPatentsArray(patentsCollection: (Patent[] | null)[]): Patent[] {
        let cits = [] as Patent[];

        patentsCollection.forEach((c) => {
            if (c === null) return;
            cits = cits.concat(c);
        });

        return cits;
    }

    /**
     * Processes an inventors/applicants name by removing parts containing '[', ']' characters
     * @param name
     */
    public static processRelatedName(name: string): string {
        return name.split('[')[0].trimEnd();
    }
}
