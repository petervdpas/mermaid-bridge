// mermaidParser.js

const { parseClassDiagram } = require('./parsers/classDiagramParser');
const { parseERDiagram } = require('./parsers/erDiagramParser');

// Helper function to identify the start or end of a metadata block
function isMetadataBlockStartOrEnd(line) {
    return line === '---';
}

// Helper function to identify single-line comments
function isCommentLine(line) {
    return line.startsWith('%%');
}

// Helper function to skip metadata block and comment lines
function skipMetadataAndCommentLines(lines) {
    let insideMetadataBlock = false;
    return lines.filter(line => {
        // Check if we are at the start or end of a metadata block
        if (isMetadataBlockStartOrEnd(line)) {
            insideMetadataBlock = !insideMetadataBlock; // Toggle metadata block status
            return false; // Skip metadata block markers
        }

        // Check if we are inside a metadata block or if the line is a comment
        if (insideMetadataBlock || isCommentLine(line)) {
            return false; // Skip lines inside metadata block or comments
        }

        // Return true for lines that are valid for processing (non-metadata, non-comment)
        return line.trim().length > 0; // Only keep non-empty, valid lines
    });
}

// Helper function to determine the type of diagram
function determineDiagramType(lines) {
    const diagramTypes = {
        classDiagram: /^classDiagram/,
        erDiagram: /^erDiagram/
    };

    // Skip metadata block lines and empty lines
    const filteredLines = skipMetadataAndCommentLines(lines);

    for (const line of filteredLines) {
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

    // Filter out metadata and comment lines
    const filteredLines = skipMetadataAndCommentLines(lines);

    const jsonResult = { type: '', classes: [], relationships: [], entities: [], flowchart: [] };

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
        default:
            throw new Error("Unsupported diagram type.");
    }

    return jsonResult;
}

module.exports = { parseMermaidToJSON };
