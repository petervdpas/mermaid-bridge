// uml-processors/erDiagramProcessor.js

const {
    translateERDToSQLType
} = require('../utils/utils');


// Function to append classes/entities and relationships to Mermaid code
function appendERDiagamToMermaid(model) {
    let mermaidElements = 'erDiagram\n';

    const entityMap = generateEntityDefinitions(model);
    const relationshipBuffer = generateRelationships(model);

    // Append entities to Mermaid code
    entityMap.forEach(entityDef => {
        mermaidElements += entityDef;
    });

    // Append relationships to Mermaid code
    relationshipBuffer.forEach(relation => {
        mermaidElements += `${relation}\n`;
    });

    return mermaidElements;
}

// Function to generate entity definitions
function generateEntityDefinitions(model) {
    const entityMap = new Map();

    model.ownedElements.forEach(element => {
        if (element instanceof type.ERDEntity) {
            let entityDef = `  ${element.name} {\n`;

            // Handle attributes (columns in ER diagrams)
            element.columns.forEach(col => {
                let columnDef = `    ${translateERDToSQLType(col.type)} ${col.name}`;

                // Prepare properties in quotes (e.g., "length: 100, nullable: true")
                let properties = [];
                if (col.length) {
                    properties.push(`length: ${col.length}`);
                }
                if (col.nullable === 'true') {
                    properties.push('nullable: true');
                } else if (col.nullable === 'false') {
                    properties.push('nullable: false');
                }

                // Add properties in quotes if they exist
                if (properties.length > 0) {
                    columnDef += ` "${properties.join(', ')}"`;
                }

                columnDef += '\n';
                entityDef += columnDef;
            });

            entityDef += `  }\n`;
            entityMap.set(element._id, entityDef);
        }
    });

    return entityMap;
}

// Function to generate relationships (placeholder for now)
function generateRelationships(model) {
    const relationshipBuffer = [];

    model.ownedElements.forEach(element => {
        processRelationshipRecursive(element, relationshipBuffer);
    });

    return relationshipBuffer;
}

// Process relationships recursively
function processRelationshipRecursive(element, relationshipBuffer) {
    if (element instanceof type.ERDRelationship) {
        const { end1, end2 } = element;
        const from = end1.reference.name;
        const to = end2.reference.name;
        const relationSymbol = determineERSymbol(end1, end2);
        addRelationshipToBuffer(from, relationSymbol, to, element.name, relationshipBuffer);
    }

    element.ownedElements?.forEach(ownedElement => {
        processRelationshipRecursive(ownedElement, relationshipBuffer);
    });
}

// Determine the relationship symbol for ER diagrams
function determineERSymbol(end1, end2) {
    return '--'; // Customize for ER relationship types like OneToMany, etc.
}

// Helper to add a relationship to the buffer
function addRelationshipToBuffer(from, relationSymbol, to, label, relationshipBuffer) {
    const relationLabel = label?.trim() ? ` : ${label}` : '';
    relationshipBuffer.push(`${from} ${relationSymbol} ${to}${relationLabel}`);
}

module.exports = { appendERDiagamToMermaid };