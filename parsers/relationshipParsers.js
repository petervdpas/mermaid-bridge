// parsers/relationshipParsers.js

const { relationshipTypes } = require('../utils/utils');

// Function to parse class diagram relationships
function parseClassDiagramRelationship(line, relationships) {
    const relationship = relationshipTypes['classDiagram'].find(rel => line.includes(rel.pattern));
    if (relationship) {
        const [fromToPart, labelPart] = line.split(':').map(part => part.trim());
        const [from, to] = fromToPart.split(relationship.pattern).map(part => part.trim());
        const label = labelPart || null;

        // Push the parsed relationship into the array
        relationships.push({
            from: from,
            to: to,
            type: relationship.type,
            label: label
        });
    } else {
        console.warn(`Could not parse class diagram relationship: ${line}`);
    }
}

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

module.exports = {
    parseClassDiagramRelationship,
    parseERDiagramRelationship
};
