// parsers/classDiagramParser.js

const { translateVisibility, shouldIgnoreLine, isRelationshipLine } = require('../utils/utils');
const { parseClassDiagramRelationship } = require('../parsers/relationshipParsers');

// Parsing logic for class diagrams
function parseClassDiagram(lines, jsonResult) {
    let currentElement = null;

    lines.forEach((line, index) => {
        // Use the utility to check if the line should be ignored
        if (shouldIgnoreLine(line, index, 'classDiagram')) {
            return; 
        }

        // Start parsing class definitions
        if (line.startsWith('class ')) {
            // Push the previous class before starting a new one
            if (currentElement) {
                jsonResult.classes.push(currentElement);
            }
            currentElement = { name: line.split(' ')[1], attributes: [], methods: [] };  // Initialize new class
        }
        // Parse attributes or methods (handling parentheses carefully)
        else if (['+', '-', '#'].some(symbol => line.startsWith(symbol))) {
            const parts = line.split(/[\s()]+/).filter(Boolean);
            const visibility = translateVisibility(parts[0][0]);
            const name = parts[1];
            const type = parts[0].substring(1);  // Everything after the visibility symbol

            // Check if the line contains parentheses (indicating a method)
            if (line.includes('()')) {
                // Handle method parsing
                const parameters = line.match(/\((.*?)\)/);  // Check if there are parameters
                currentElement.methods.push({
                    visibility: visibility,
                    name: name,
                    returnType: type,
                    parameters: parameters ? parameters[1].split(',').map(param => param.trim()) : []
                });
            } else {
                // Handle attribute parsing
                currentElement.attributes.push({ visibility, name, type });
            }
        }
        // Handle relationships
        else if (isRelationshipLine(line, 'classDiagram')) {
            parseClassDiagramRelationship(line, jsonResult.relationships, 'classDiagram');
        } 
        // Unrecognized lines (could be handled as warnings if necessary)
        else {
            console.warn(`Unrecognized line in classDiagram: ${line}`);
        }
    });

    // Add the last class if applicable
    if (currentElement) {
        jsonResult.classes.push(currentElement);
    }
}

module.exports = { parseClassDiagram };
