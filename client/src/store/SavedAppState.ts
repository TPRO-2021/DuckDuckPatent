import { PatentMap } from '@/models/PatentMap';
import { Filter } from '@/models/Filter';
import { Patent } from '@/models/Patent';
import { VisualPatentNode } from '@/models/VisualPatentNode';

/**
 * The entire application views will have global containers to share data between components which is the state
 * This states are rendered in vue components as soon the states will be mutated
 */
export class SavedAppState {
    /**
     * Holds the current search terms of the user
     */
    public searchTerms = [] as string[];

    /**
     * Holds the suggested terms related with search term of user
     */
    public suggestedTerms = [] as string[];

    /**
     * Node visualization options
     */
    public visualizationOptions = ['patents'];

    /**
     * Contains the saved patents
     */
    public savedPatents = {} as PatentMap;

    /**
     * API Filters
     */
    public filters = [] as Filter[];

    /**
     * One checkmark will be added to all saved node indices
     */
    public markedVisited = {} as { [id: string]: 'once' | 'twice' };

    // /**
    //  * Two checkmarks will be added to all saved node indices
    //  */
    // public markedTwice = [] as string[];
}
