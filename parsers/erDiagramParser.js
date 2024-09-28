// erDiagramParser.js

const { isRelationshipLine, parseRelationship } = require('../utils/utils');

// Parsing logic for ER diagrams
function parseERDiagram(lines, jsonResult) {
    let currentElement = null;

    lines.forEach(line => {
        if (line.includes('{')) {
            if (currentElement) jsonResult.entities.push(currentElement);
            currentElement = { name: line.split(' ')[0], attributes: [] };
        } else if (line.includes('}')) {
            jsonResult.entities.push(currentElement);
            currentElement = null;
        } else if (currentElement && line.includes(' ')) {
            const [type, name] = line.split(' ');
            currentElement.attributes.push({ type, name });
        } else if (isRelationshipLine(line, 'erDiagram')) {
            parseRelationship(line, jsonResult.relationships, 'erDiagram');
        } else {
            console.warn(`Unrecognized line in erDiagram: ${line}`);
        }
    });

    // Add the last entity if applicable
    if (currentElement) {
        jsonResult.entities.push(currentElement);
    }
}

module.exports = { parseERDiagram };
