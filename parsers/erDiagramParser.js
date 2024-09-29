// erDiagramParser.js

const { isRelationshipLine, parseRelationship } = require('../utils/utils');

// Helper function to parse field properties like "length: 100, nullable: true"
function parseFieldProperties(fieldString) {
    const propertyPattern = /"([^"]+)"/; // Extracts the part within quotes
    const propertyMatch = fieldString.match(propertyPattern);
    if (propertyMatch) {
        const properties = propertyMatch[1]
            .split(',')
            .map(prop => prop.trim())
            .reduce((acc, prop) => {
                const [key, value] = prop.split(':').map(s => s.trim());
                acc[key] = value;
                return acc;
            }, {});
        return properties;
    }
    return {};
}

// Parsing logic for ER diagrams
function parseERDiagram(lines, jsonResult) {
    let currentElement = null;

    lines.forEach((line, index) => {
        // Ignore the diagram declaration line
        if (index === 0 && line.trim() === 'erDiagram') {
            return; 
        }

        // First, check if the line is a relationship before checking for entities
        if (isRelationshipLine(line, 'erDiagram')) {
            // If it's a relationship, parse it
            parseRelationship(line, jsonResult.relationships, 'erDiagram');
        } else if (line.includes('{') && !isRelationshipLine(line, 'erDiagram')) {
            // Start of a new entity block, only if it's not a relationship
            if (currentElement) {
                jsonResult.entities.push(currentElement);
            }
            currentElement = { name: line.split(' ')[0], attributes: [] }; // Create a new entity
        } else if (line.includes('}') && currentElement) {
            // End of the current entity block
            jsonResult.entities.push(currentElement);
            currentElement = null; // Close the current entity after pushing
        } else if (currentElement && line.includes(' ')) {
            // Parsing fields (attributes) inside an entity
            const [type, name, ...propertyParts] = line.split(' ');
            const properties = propertyParts.join(' ').trim(); // Extract properties in quotes
            const fieldProps = parseFieldProperties(properties); // Parse properties like length, nullable
            currentElement.attributes.push({
                type: type,
                name: name,
                properties: fieldProps
            });
        } else {
            console.warn(`Unrecognized line in erDiagram: ${line}`);
        }
    });

    // Ensure the last entity is pushed if the file ends without a closing `}`
    if (currentElement) {
        jsonResult.entities.push(currentElement);
    }
}

module.exports = { parseERDiagram };
