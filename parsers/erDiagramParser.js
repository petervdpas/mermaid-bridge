const { isRelationshipLine, parseRelationship, shouldIgnoreLine } = require('../utils/utils');

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
        // Use the utility to check if the line should be ignored
        if (shouldIgnoreLine(line, index, 'erDiagram')) {
            return; 
        }

        // Check if the line is a relationship
        if (isRelationshipLine(line, 'erDiagram')) {
            parseRelationship(line, jsonResult.relationships, 'erDiagram');
        }
        // Start of a new entity block
        else if (line.includes('{')) {
            // Push the current entity before starting a new one
            if (currentElement) {
                jsonResult.entities.push(currentElement);
            }
            currentElement = { name: line.split(' ')[0], attributes: [] }; // Create a new entity
        }
        // End of the current entity block
        else if (line.includes('}') && currentElement) {
            jsonResult.entities.push(currentElement);
            currentElement = null; // Close the current entity
        }
        // Parsing fields (attributes) inside an entity
        else if (currentElement && line.includes(' ')) {
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
