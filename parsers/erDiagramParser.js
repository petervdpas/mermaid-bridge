// parsers/erDiagramParser.js

const { relationshipTypes, shouldIgnoreLine, isRelationshipLine } = require('../utils/utils');

// Function to parse ER diagram relationships
function parseERDiagramRelationship(line, relationships) {
    let leftType = null;
    let rightType = null;
    let isWeak = false; // Assume it's not weak unless determined otherwise

    // Split the line into the relationship part and the label part (after the colon)
    const [relationshipPart, labelPart] = line.split(':').map(part => part.trim());
    const label = labelPart || null;  // The label (e.g., "uses")

    // First, find the connector (either IsStrong or IsWeak)
    const connectorPattern = relationshipTypes['erDiagram'].find(rel =>
        relationshipPart.includes(rel.pattern) && (rel.type === 'IsStrong' || rel.type === 'IsWeak')
    );
    
    if (connectorPattern) {
        // Determine if the connector is weak based on its type
        isWeak = connectorPattern.type === 'IsWeak';
    } else {
        console.warn(`No connector found in line: ${line}`);
        return;
    }

    // Extract the left and right side of the relationship (before and after the connector)
    const [fromSide, toSide] = relationshipPart.split(connectorPattern.pattern).map(part => part.trim());

    // Find the left pattern (before the connector)
    const leftPattern = relationshipTypes['erDiagram'].find(rel => fromSide.endsWith(rel.pattern));
    if (leftPattern) {
        leftType = leftPattern.type;
    }

    // Find the right pattern (after the connector)
    const rightPattern = relationshipTypes['erDiagram'].find(rel => toSide.startsWith(rel.pattern));
    if (rightPattern) {
        rightType = rightPattern.type;
    }

    // Remove patterns from `from` and `to` entities
    const from = fromSide.replace(leftPattern ? leftPattern.pattern : '', '').trim();
    const to = toSide.replace(rightPattern ? rightPattern.pattern : '', '').trim();

    if (leftType && rightType && from && to) {
        // Push the relationship into the array with fromType, toType, label, and weak flag
        relationships.push({
            from: from,               // The "from" entity
            fromType: leftType,       // The type of the "from" entity (e.g., ZeroOrOne, ExactlyOne)
            to: to,                   // The "to" entity
            toType: rightType,        // The type of the "to" entity (e.g., ZeroOrMany, OneOrMany)
            label: label,             // The relationship label (e.g., "places", "uses")
            weak: isWeak              // Flag indicating if it's a weak relationship (determined immediately)
        });
    } else {
        console.warn(`Could not parse ER diagram relationship: ${line}`);
    }
}

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
            parseERDiagramRelationship(line, jsonResult.relationships, 'erDiagram');
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
