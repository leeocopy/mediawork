const fs = require('fs');
const filePath = 'c:\\Users\\PC\\Desktop\\200\\createcont\\app\\app\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Use flexible whitespace regex for handlers
const renderingRegex = /const handleRenderVisuals = async \(\) => \{[\s\S]*?setRendering\(false\);[\s\S]*?\};/;
const newHandler = `const handleRenderVisuals = async () => {
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

if (renderingRegex.test(content)) {
    content = content.replace(renderingRegex, newHandler);
    console.log('✅ Replaced Render Visuals handler');
} else {
    console.error('❌ Could not find Render Visuals handler');
}

// Update Review status regex
content = content.replace(/setPost\(\{ \.\.\.post, status \}\);/g, 'setPost({ ...post, status: data.data.status });');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
