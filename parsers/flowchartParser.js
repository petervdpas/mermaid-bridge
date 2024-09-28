// flowchartParser.js

// Parsing logic for flowcharts
function parseFlowchart(lines, jsonResult) {
    lines.forEach(line => {
        if (line.includes('-->')) {
            const [from, to] = line.split('-->').map(part => part.trim());
            jsonResult.flowchart.push({ from, to });
        } else if (line.includes('["')) {
            // Handle markdown inside node definitions
            const nodeMatch = line.match(/(\w+)\["(.+)"\]/);
            if (nodeMatch) {
                const [_, nodeId, nodeContent] = nodeMatch;
                jsonResult.flowchart.push({ nodeId, content: nodeContent });
            }
        } else {
            console.warn(`Unrecognized line in flowchart: ${line}`);
        }
    });
}

module.exports = { parseFlowchart };
