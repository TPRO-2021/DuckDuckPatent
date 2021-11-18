/**
 * This model represents all available visualization options
 */
export interface VisualizationOptions {
    center: {
        x: number;
        y: number;
    };
    charge: {
        enabled: boolean;
        strength: number;
        distanceMin: number;
        distanceMax: number;
    };
    collide: {
        enabled: boolean;
        strength: number;
        iterations: number;
        radius: number;
    };
    forceX: {
        enabled: boolean;
        strength: number;
        x: number;
    };
    forceY: {
        enabled: boolean;
        strength: number;
        y: number;
    };
    link: {
        enabled: boolean;
        strength: number;
        distance: number;
        iterations: number;
    };
}
