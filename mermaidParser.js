// mermaidParser.js

const { skipMetadataAndCommentLines, determineDiagramType } = require('./utils/utils');
const { parseClassDiagram } = require('./parsers/classDiagramParser');
const { parseERDiagram } = require('./parsers/erDiagramParser');
const { parseSequenceDiagram } = require('./parsers/sequenceDiagramParser');

// Main function to parse Mermaid code to JSON structure
function convertToUML(mermaidCode) {
    const lines = mermaidCode.split('\n').map(line => line.trim());

    // Filter out metadata and comment lines
    const filteredLines = skipMetadataAndCommentLines(lines);

    // Initialize the parsed data object with the diagram type
    const jsonResult = { type: '' };

    // Determine the type of diagram from the filtered lines
    jsonResult.type = determineDiagramType(filteredLines);

    // Call the appropriate parser based on diagram type
    switch (jsonResult.type) {
        case 'classDiagram':
            parseClassDiagram(filteredLines, jsonResult);
            break;
        case 'erDiagram':
            parseERDiagram(filteredLines, jsonResult);
            break;
        case 'sequenceDiagram':
            parseSequenceDiagram(filteredLines, jsonResult);
            break;
        default:
            throw new Error("Unsupported diagram type.");
    }

    return jsonResult;
}

module.exports = { convertToUML };
