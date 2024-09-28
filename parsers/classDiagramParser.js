// classDiagramParser.js

const { isRelationshipLine, parseRelationship, translateVisibility } = require('../utils/utils');

// Parsing logic for class diagrams
function parseClassDiagram(lines, jsonResult) {
    let currentElement = null;

    lines.forEach(line => {
        if (line.startsWith('class ')) {
            if (currentElement) jsonResult.classes.push(currentElement);
            currentElement = { name: line.split(' ')[1], attributes: [], methods: [] };
        } else if (['+', '-', '#'].some(symbol => line.startsWith(symbol))) {
            const parts = line.split(/[\s()]+/).filter(Boolean);
            const visibility = translateVisibility(parts[0][0]);
            const name = parts[1];
            const type = parts[0].substring(1);

            if (line.includes('()')) {
                const parameters = line.match(/\((.*?)\)/)[1].split(',').map(param => param.trim());
                currentElement.methods.push({ visibility, name, returnType: type, parameters });
            } else {
                currentElement.attributes.push({ visibility, name, type });
            }
        } else if (isRelationshipLine(line, 'classDiagram')) {
            parseRelationship(line, jsonResult.relationships, 'classDiagram');
        } else {
            console.warn(`Unrecognized line in classDiagram: ${line}`);
        }
    });

    // Add the last class if applicable
    if (currentElement) {
        jsonResult.classes.push(currentElement);
    }
}

module.exports = { parseClassDiagram };
