export type IGFormat = 'IG_POST' | 'IG_CAROUSEL' | 'IG_STORY';
export type VisualStyle = 'LIFESTYLE' | 'INFOGRAPHIC' | 'PRODUCT' | 'EDUCATIONAL';

export interface TemplateConfig {
    format: IGFormat;
    dimensions: { width: number; height: number };
}

export const FORMAT_CONFIGS: Record<IGFormat, TemplateConfig> = {
    IG_POST: {
        format: 'IG_POST',
        dimensions: { width: 1080, height: 1080 }
    },
    IG_CAROUSEL: {
        format: 'IG_CAROUSEL',
        dimensions: { width: 1080, height: 1350 }
    },
    IG_STORY: {
        format: 'IG_STORY',
        dimensions: { width: 1080, height: 1920 }
    }
};

export interface StyleConfig {
    style: VisualStyle;
    safeMargins: number;
    logoPlacement: 'top-left' | 'bottom-right' | 'top-right' | 'bottom-left';
    textStyles: {
        title: { fontSize: number; fontWeight: string; color: string; textAlign: 'center' | 'left' | 'right' };
        subtitle: { fontSize: number; fontWeight: string; color: string; textAlign: 'center' | 'left' | 'right' };
        cta: { fontSize: number; fontWeight: string; color: string; textAlign: 'center' | 'left' | 'right' };
    };
}

export const STYLE_CONFIGS: Record<VisualStyle, StyleConfig> = {
    LIFESTYLE: {
        style: 'LIFESTYLE',
        safeMargins: 100,
        logoPlacement: 'bottom-right',
        textStyles: {
            title: { fontSize: 80, fontWeight: '900', color: 'white', textAlign: 'center' },
            subtitle: { fontSize: 32, fontWeight: '400', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
            cta: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'center' }
        }
    },
    INFOGRAPHIC: {
        style: 'INFOGRAPHIC',
        safeMargins: 80,
        logoPlacement: 'top-right',
        textStyles: {
            title: { fontSize: 60, fontWeight: '800', color: '#111827', textAlign: 'left' },
            subtitle: { fontSize: 26, fontWeight: '500', color: '#4B5563', textAlign: 'left' },
            cta: { fontSize: 24, fontWeight: '700', color: 'white', textAlign: 'left' }
        }
    },
    PRODUCT: {
        style: 'PRODUCT',
        safeMargins: 120,
        logoPlacement: 'bottom-left',
        textStyles: {
            title: { fontSize: 90, fontWeight: '900', color: 'white', textAlign: 'center' },
            subtitle: { fontSize: 36, fontWeight: '300', color: 'white', textAlign: 'center' },
            cta: { fontSize: 30, fontWeight: '800', color: 'white', textAlign: 'center' }
        }
    },
    EDUCATIONAL: {
        style: 'EDUCATIONAL',
        safeMargins: 90,
        logoPlacement: 'top-left',
        textStyles: {
            title: { fontSize: 70, fontWeight: '900', color: '#4F46E5', textAlign: 'left' },
            subtitle: { fontSize: 30, fontWeight: '400', color: '#374151', textAlign: 'left' },
            cta: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'left' }
        }
    }
};
