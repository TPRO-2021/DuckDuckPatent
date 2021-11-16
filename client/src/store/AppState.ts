import { Patent } from '@/models/Patent';
import { SavedAppState } from './SavedAppState';
import { PatentMap } from '@/models/PatentMap';

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
     * Type of node currently highlighted
     */
    public patentType = '' as string;

    /**
     * Highlight border of a node upon its click or preview
     */
    public highlightNode = false;

    /**
     * Controls one/two checkmark assignment
     */
    public markTwice = false;

    /**
     * Contains temporary saved extended patents. Is used to pass patent info to different views
     */
    public extendedPatents = {} as PatentMap;

    /**
     * Contains temporary saved patent families. Is used to pass patent family info to different views
     */
    public patentFamilies = {} as Record<string, Patent[]>;
}
