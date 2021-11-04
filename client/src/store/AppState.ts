import { Patent } from '@/models/Patent';
import { SavedAppState } from './SavedAppState';

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
     * Index of patent currently previewed (on Results page)
     */
    public patentIndex = -1;
    /**
     * Highlight border of a node upon its click or preview
     */
    public highlightNode = false;
}
