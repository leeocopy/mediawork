import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Buffer } from 'buffer';
import { FORMAT_CONFIGS, STYLE_CONFIGS, IGFormat, VisualStyle } from './templates';

export interface RenderOptions {
    postId: string;
    ideaId: string;
    format: IGFormat;
    style: VisualStyle;
    backgroundUrl: string;
    logoUrl?: string;
    logoBase64?: string;
    overlayText: string;
    subtitleText?: string;
    ctaText?: string;
    brandColors: { primary: string; secondary: string; accent: string };
    fontFamily: string;
    brandInitial: string;
}

export async function renderFinalVisual(options: RenderOptions): Promise<string> {
    const {
        postId, ideaId, format, style, backgroundUrl, logoUrl, logoBase64,
        overlayText, subtitleText, ctaText, brandColors, fontFamily, brandInitial
    } = options;

    const formatCfg = FORMAT_CONFIGS[format] || FORMAT_CONFIGS.IG_POST;
    const styleCfg = STYLE_CONFIGS[style] || STYLE_CONFIGS.LIFESTYLE;
    const { width, height } = formatCfg.dimensions;
    const padding = styleCfg.safeMargins;

    const outputDir = path.join(process.cwd(), 'public', 'generated', postId);
    await fs.mkdir(outputDir, { recursive: true });

    const fileName = `visual_${ideaId}_${Date.now()}.png`;
    const outputPath = path.join(outputDir, fileName);
    const publicUrl = `/generated/${postId}/${fileName}`;

    try {
        // 1. Fetch Background
        const bgResponse = await fetch(backgroundUrl);
        const bgBuffer = Buffer.from(new Uint8Array(await bgResponse.arrayBuffer()));

        // 2. Prepare Logo
        let logoBuffer: Buffer | null = null;
        if (logoBase64) {
            logoBuffer = Buffer.from(logoBase64.split(',')[1], 'base64');
        } else if (logoUrl) {
            try {
                const logoRes = await fetch(logoUrl);
                logoBuffer = Buffer.from(new Uint8Array(await logoRes.arrayBuffer()));
            } catch (e) {
                console.warn('Failed to fetch logoUrl, using monogram fallback');
            }
        }

        // 3. Logo Fallback Monogram
        const logoSize = 140;
        let logoPlacementSvg = '';
        if (!logoBuffer) {
            const lx = styleCfg.logoPlacement.includes('left') ? padding : width - logoSize - padding;
            const ly = styleCfg.logoPlacement.includes('top') ? padding : height - logoSize - padding;
            logoPlacementSvg = `
                <g transform="translate(${lx}, ${ly})">
                    <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="${brandColors.primary}" />
                    <text x="${logoSize / 2}" y="${logoSize / 2 + 20}" font-family="${fontFamily}, sans-serif" font-size="70" font-weight="900" fill="white" text-anchor="middle">${brandInitial}</text>
                </g>
            `;
        }

        // 4. Text Rendering Logic
        const textStyle = styleCfg.textStyles.title;
        const alignX = textStyle.textAlign === 'center' ? width / 2 : (textStyle.textAlign === 'left' ? padding : width - padding);
        const textAnchor = textStyle.textAlign === 'center' ? 'middle' : (textStyle.textAlign === 'left' ? 'start' : 'end');

        // Multi-line Title
        const words = overlayText.split(' ');
        const lines: string[] = [];
        let cur = '';
        words.forEach(w => {
            if ((cur + w).length > 22) { lines.push(cur.trim()); cur = w + ' '; }
            else cur += w + ' ';
        });
        lines.push(cur.trim());

        const titleFontSize = textStyle.fontSize;
        const lineSpacing = 1.2;
        const titleLineHeight = titleFontSize * lineSpacing;
        const titleTotalHeight = lines.length * titleLineHeight;

        // Vertical positioning based on format
        let startY = (height / 2) - (titleTotalHeight / 2);
        if (format === 'IG_STORY') startY = height * 0.3;

        const titleColor = style === 'INFOGRAPHIC' ? brandColors.primary : textStyle.color;

        const titleSvgLines = lines.map((line, i) =>
            `<tspan x="${alignX}" dy="${i === 0 ? 0 : titleLineHeight}">${line.toUpperCase()}</tspan>`
        ).join('');

        // Gradient & Overlay for readability
        const overlaySvg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="black" stop-opacity="0.3" />
                        <stop offset="100%" stop-color="black" stop-opacity="0.7" />
                    </linearGradient>
                    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
                        <feOffset dx="0" dy="10" result="offsetblur"/>
                        <feComponentTransfer><feFuncA type="linear" slope="0.7"/></feComponentTransfer>
                        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#overlayGrad)" opacity="${style === 'LIFESTYLE' || style === 'PRODUCT' ? 1 : 0}" />
                
                ${logoPlacementSvg}

                <text 
                    x="${alignX}" 
                    y="${startY}" 
                    font-family="${fontFamily}, sans-serif" 
                    font-size="${titleFontSize}" 
                    font-weight="900" 
                    fill="${titleColor}" 
                    text-anchor="${textAnchor}" 
                    ${style !== 'INFOGRAPHIC' ? 'filter="url(#textShadow)"' : ''}
                >
                    ${titleSvgLines}
                </text>

                ${subtitleText ? `
                <text 
                    x="${alignX}" 
                    y="${startY + titleTotalHeight + 60}" 
                    font-family="${fontFamily}, sans-serif" 
                    font-size="${styleCfg.textStyles.subtitle.fontSize}" 
                    font-weight="500" 
                    fill="${style === 'INFOGRAPHIC' ? '#4B5563' : 'rgba(255,255,255,0.9)'}" 
                    text-anchor="${textAnchor}"
                >
                    ${subtitleText}
                </text>
                ` : ''}

                ${ctaText ? `
                <g transform="translate(${textAnchor === 'middle' ? (width / 2 - 200) : (textAnchor === 'start' ? padding : width - 400 - padding)}, ${height - padding - 100})">
                    <rect width="400" height="100" rx="50" fill="${brandColors.primary}" />
                    <text x="200" y="62" font-family="${fontFamily}, sans-serif" font-size="34" font-weight="900" fill="white" text-anchor="middle">${ctaText.toUpperCase()}</text>
                </g>
                ` : ''}
            </svg>
        `;

        // 5. Final Composite
        const composites: any[] = [
            { input: Buffer.from(overlaySvg), top: 0, left: 0 }
        ];

        if (logoBuffer) {
            const resizedLogo = await sharp(logoBuffer)
                .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toBuffer();
            const lx = styleCfg.logoPlacement.includes('left') ? padding : width - logoSize - padding;
            const ly = styleCfg.logoPlacement.includes('top') ? padding : height - logoSize - padding;
            composites.push({ input: resizedLogo, top: ly, left: lx });
        }

        await sharp(bgBuffer)
            .resize(width, height)
            .composite(composites)
            .toFile(outputPath);

        return publicUrl;
    } catch (error) {
        console.error('Final Visual Render Error:', error);
        return backgroundUrl; // Fallback
    }
}
