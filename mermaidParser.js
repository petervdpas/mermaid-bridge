// mermaidParser.js

const { parseClassDiagram } = require('./parsers/classDiagramParser');
const { parseERDiagram } = require('./parsers/erDiagramParser');
const { parseFlowchart } = require('./parsers/flowchartParser');

// Helper function to identify metadata or configuration lines
function isMetadataLine(line) {
    return line.startsWith('---') || line.startsWith('%%');
}

// Helper function to determine the type of diagram
function determineDiagramType(lines) {
    const diagramTypes = {
        erDiagram: /^erDiagram/,
        classDiagram: /^classDiagram/,
        flowchart: /^flowchart/
    };

    for (const line of lines) {
        // Skip metadata or configuration lines
        if (isMetadataLine(line)) continue;

        // Check the line for a diagram type
        for (const [type, pattern] of Object.entries(diagramTypes)) {
            if (pattern.test(line)) {
                return type;
            }
        }
    }

    throw new Error("Unsupported or unrecognized diagram type.");
}

// Main function to parse Mermaid code to JSON structure
function parseMermaidToJSON(mermaidCode) {
    const lines = mermaidCode.split('\n').map(line => line.trim());
    const jsonResult = { type: '', classes: [], relationships: [], entities: [], flowchart: [] };

    // Determine the type of diagram
    jsonResult.type = determineDiagramType(lines);

    // Call the appropriate parser based on diagram type
    switch (jsonResult.type) {
        case 'classDiagram':
            parseClassDiagram(lines, jsonResult);
            break;

        case 'erDiagram':
            parseERDiagram(lines, jsonResult);
            break;

        case 'flowchart':
            parseFlowchart(lines, jsonResult);
            break;

        default:
            throw new Error("Unsupported diagram type.");
    }

    return jsonResult;
}

module.exports = { parseMermaidToJSON };
