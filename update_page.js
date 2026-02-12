const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\PC\\Desktop\\200\\createcont\\app\\app\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add exporting state
content = content.replace(
    /const \[rendering, setRendering\] = useState\(false\);/,
    "const [rendering, setRendering] = useState(false);\n    const [exporting, setExporting] = useState(false);"
);

// 2. Update handleRenderVisuals and add handleExportZIP
const oldHandler = `    const handleRenderVisuals = async () => {
        setRendering(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost(\`/api/posts/\${post.id}/render-images\`, {}, token || undefined);
            if (res.ok) {
                setAiOutput(data.data);
                onUpdate(); // To log activity or update something globally if needed
            } else {
                setError(data.error || 'Failed to render visuals');
            }
        } catch (err) {
            setError('An error occurred during rendering');
        } finally {
            setRendering(false);
        }
    };`;

const newHandler = `    const handleRenderVisuals = async () => {
        setRendering(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { res, data } = await apiPost(\`/api/posts/\${post.id}/render\`, {}, token || undefined);
            if (res.ok) {
                fetchAIOutput();
                onUpdate();
            } else {
                setError(data.error || 'Failed to render visuals');
            }
        } catch (err) {
            setError('An error occurred during rendering');
        } finally {
            setRendering(false);
        }
    };

    const handleExportZIP = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(\`/api/posts/\${post.id}/export\`, {
                headers: { 'Authorization': \`Bearer \${token}\` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`post_package_\${post.id}.zip\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                setError('Export failed');
            }
        } catch (err) {
            setError('Error exporting package');
        } finally {
            setExporting(false);
        }
    };`;

content = content.replace(oldHandler.trim(), newHandler.trim());

// 3. Update JSX to use image_ideas (This is complex, let's use a simpler regex)
// We need to replace the whole block between {aiOutput.visualSystem && ( and </div>)}
// but specifically the section dealing with visualPlans.

content = content.replace(/aiOutput\.visualPlans/g, 'aiOutput.image_ideas');
content = content.replace(/plan\.ideaNumber/g, '(idx + 1)');
content = content.replace(/plan\.backgroundPrompt/g, 'plan.image_prompt');
content = content.replace(/plan\.overlayText/g, 'plan.text_overlay.headline');
content = content.replace(/plan\.subtitleText/g, 'plan.text_overlay.sub');
content = content.replace(/1080 x 1350 px/g, 'plan.composition');

// 4. Update the Button area to include Export ZIP
const buttonAreaOld = `<button
                                                            onClick={handleRenderVisuals}
                                                            disabled={rendering}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 group"
                                                        >
                                                            {rendering ? (
                                                                <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> RENDERING...</>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    GENERATE FINAL VISUALS
                                                                </>
                                                            )}
                                                        </button>`;

const buttonAreaNew = `<div className="flex gap-2">
                                                    {!aiOutput.image_ideas?.some((p) => p.status === 'RENDERED') ? (
                                                        <button
                                                            onClick={handleRenderVisuals}
                                                            disabled={rendering}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 group"
                                                        >
                                                            {rendering ? (
                                                                <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> RENDERING...</>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    GENERATE FINAL VISUALS
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleExportZIP}
                                                            disabled={exporting}
                                                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black shadow-lg transition-all flex items-center gap-2"
                                                        >
                                                            {exporting ? 'EXPORTING...' : 'EXPORT ZIP PACKAGE'}
                                                        </button>
                                                    )}
                                                </div>`;

content = content.replace(buttonAreaOld.trim(), buttonAreaNew.trim());

// 5. Fix review status update
content = content.replace(/setPost\({ \.\.\.post, status }\);/, 'setPost({ ...post, status: data.data.status });');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated page.tsx');
