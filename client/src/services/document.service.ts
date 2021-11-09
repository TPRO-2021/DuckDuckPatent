import HttpService from '@/services/http.service';
import { DocumentInformation } from '@/models/DocumentInformation';

export default class DocumentService extends HttpService {
    /**
     * Queries the backend for images belonging to a patent
     * @param patentId
     */
    async query(patentId: string): Promise<DocumentInformation[] | null> {
        const response = await this.makeRequest(`/api/patents/${patentId}/documents`);
        const json = (await response.json()) as DocumentInformation[];

        this.requestPending = false;
        return json;
    }

    /**
     * Gets a page of the document
     * @param patentId
     * @param document
     * @param page
     */
    async get(patentId: string, document: DocumentInformation, page = 1): Promise<Blob> {
        const url = `/api/patents/${patentId}/documents/${btoa(document.url)}?range=${page}`;

        // preferable we want to get a pdf document back
        const type = DocumentService.getFormat(document);

        const response = await this.makeRequest(url, type);
        return response.blob();
    }

    /**
     * Attempts to get the format of a document information object
     * @param document
     */
    public static getFormat(document: DocumentInformation): string {
        // preferable we want to get a pdf document back
        let type = document.formats.filter((format) => format === 'application/json')[0];
        if (!type) {
            type = document.formats[0];
        }

        return type;
    }
}
