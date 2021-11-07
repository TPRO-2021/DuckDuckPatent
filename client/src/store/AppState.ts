import { Patent } from '@/models/Patent';
import { SavedAppState } from './SavedAppState';
import { VisualPatentNode } from '@/models/VisualPatentNode';

/**
 * The entire application views will have global containers to share data between components which is the state
 * This states are rendered in vue components as soon the states will be mutated
 */
export class AppState extends SavedAppState {
    /**
     * Holds the the patents as a result of research
     */
    public patents = [] as Patent[];

    /**
     * Holds the current result page count
     */
    public pageCount = 0;

    /**
     * Holds the loadingScreen state
     * True if the loading screen should be visible
     */
    public showLoadingScreen = false;

    /**
     * Holds the loadingBar state
     * True if the loadingBar should be visible
     */
    public showLoadingBar = false;
    /**
     * Holds the showNoResultsToast state
     * True if the toast should be visible
     */
    public showNoResultsToast = false;
    /**
     * Holds the showErrorToast state
     * True if the toast should be visible
     */
    public showErrorToast = false;

    /**
     * Holds the current total count value
     */
    public totalCount = 0;
    /**
     * Holds the dialog mask state
     * True if dialog mask should be visible
     */
    public showDialogMask = false;
    /**
     * Id of patent currently previewed (on Results page)
     */
    public patentID = '' as string;
    /**
     * Highlight border of a node upon its click or preview
     */
    public highlightNode = false;
    /**
     * One checkmark will be added to all saved node indices
     */
    // public markedNode = {} as {[id: string]: ('one' | 'twice')};
    /**
     * Two checkmarks will be added to all saved node indices
     */
    // public markedTwice = [] as string[];
    /**
     * Controls one/two checkmark assignment
     */
    //public markTwice = false;
}
