import { Patent } from '@/models/Patent';
import { NodeInfo } from '@/models/NodeInfo';
import { PatentMap } from '@/models/PatentMap';
import { PatentPreview } from '@/models/PatentPreview';
import { NodePreview } from '@/models/NodePreview';

/**
 * Service which provides utility functions used to create patent preview items
 */
export default class PreviewHelperService {
    /**
     * Helper to get the title, abstract for the patent preview on clicking on the node
     *
     * @param patent    The patent for which to get the preview
     * @param savedPatents  The patents which should be saved
     */
    static getPatentPreview(patent: Patent, savedPatents: PatentMap): PatentPreview {
        let author = (patent?.applicants ?? [])[0] ?? '';
        if (patent?.applicants?.length ?? 0 > 1) {
            author += '...';
        }
        let abstract = patent?.abstract?.slice(0, 400) ?? '';
        if (patent?.abstract?.length ?? 0 > 400) {
            abstract += '...';
        }
        return {
            id: patent?.id,
            title: patent?.title ?? '',
            subTitle: author,
            mainText: abstract,
            showSave: !(savedPatents || {})[patent?.id],
        };
    }

    /**
     * Helper to get the citation number and related patent for node preview
     *
     * @param node  The node for which to get the preview
     * @param patents   The patents array
     */
    static getCitationPreview(node: NodeInfo, patents: Patent[]): NodePreview {
        const citedPatents = patents.filter((t) => t?.citations?.some((t) => t.id === node?.id));
        return {
            id: node.id,
            title: `CITATION ${node.id}`,
            type: node.type,
            subTitle: 'Cited By',
            relatedPatents: citedPatents,
        };
    }

    /**
     * Helper to get the author name and the invented patents for node preview
     *
     * @param node  The node for which to get the preview
     * @param patents   The patents array
     * @param path  The path of the data on a patent
     * @param titlePrefix   The prefix used for the title
     * @param subTitle  The subtitle of the preview
     */
    static getPreview(
        node: NodeInfo,
        patents: Patent[],
        path: 'inventors' | 'applicants',
        titlePrefix = '',
        subTitle = '',
    ): NodePreview {
        const authorPatents = patents.filter((patent) => patent[path]?.includes(node.id));

        return {
            id: node.id,
            title: `${titlePrefix}${node.id}`,
            type: node.type,
            subTitle: subTitle,
            relatedPatents: authorPatents,
        };
    }
}
