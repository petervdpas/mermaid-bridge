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

// Parsing logic for ER diagrams
function parseERDiagram(lines, jsonResult) {

    // Initialize specific fields for an ER diagram
    jsonResult.entities = [];
    jsonResult.relationships = [];
    
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
        // Start of a new entity block (e.g., "CUSTOMER {")
        else if (line.includes('{')) {
            // Push the current entity before starting a new one
            if (currentElement) {
                jsonResult.entities.push(currentElement);
            }
            const entityName = line.split('{')[0].trim();  // Extract entity name
            currentElement = { name: entityName, columns: [] }; // Create a new entity
        }
        // End of the current entity block (e.g., "}")
        else if (line.includes('}') && currentElement) {
            jsonResult.entities.push(currentElement);
            currentElement = null; // Close the current entity
        }
        // Parsing fields (attributes) inside an entity (e.g., "string name")
        else if (currentElement && /\S+\s+\S+/.test(line)) {

             // Regex pattern to match type, name, keys, and properties
            const regex = /(\S+)\s+(\S+)\s*([A-Za-z,]+)?\s*(?:"([^"]+)")?/; 
            const match = line.match(regex);

            if (match) {
                const [_, type, name, keyString = '', propertiesString = ''] = match;
                
                const length = type.includes('(') ? type.split('(')[1].split(')')[0] : null;
                const reTyped = type.replace(`(${length})`, '');

                // Parse keys and properties
                const fieldKeys = parseKeys(keyString.trim());
                const fieldProps = parseFieldProperties(`"${propertiesString}"`); 

                // If there's a length, add it to the properties
                if (length) {
                    fieldProps['length'] = length;
                }
                
                // Push the parsed field into the current entity
                currentElement.columns.push({
                    type: reTyped,
                    name: name,
                    keys: fieldKeys, 
                    properties: fieldProps
                });
            } else {
                console.warn(`Unrecognized line in entity: ${line}`);
            }
        } 
        // Unrecognized line outside of entity or relationship
        else {
            console.warn(`Unrecognized line in erDiagram: ${line}`);
        }
    });

    // Ensure the last entity is pushed if the file ends without a closing `}`
    if (currentElement) {
        jsonResult.entities.push(currentElement);
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

// Helper function to parse the keys like PK, FK, UK
function parseKeys(keyString) {
    const validKeys = ['PK', 'FK', 'UK']; // Define valid keys
    const keys = keyString.split(',').map(key => key.trim());
    return keys.filter(key => validKeys.includes(key));
}

module.exports = { parseERDiagram };
