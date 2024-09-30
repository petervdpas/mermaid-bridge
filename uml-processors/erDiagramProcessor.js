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

                // Add keys (e.g., PK, FK, UK) if present
                columnDef += getColumnKeys(col);

                // Add properties in quotes (e.g., "length: 100, nullable: true") if present
                columnDef += getColumnProperties(col);

                columnDef += '\n';
                entityDef += columnDef;
            });

            entityDef += `  }\n`;
            entityMap.set(element._id, entityDef);
        }
    });

    return entityMap;
}

// Function to prepare and add keys (e.g., PK, FK, UK) if present
function getColumnKeys(col) {
    let keys = [];
    if (col.primaryKey) {
        keys.push('PK');
    }
    if (col.foreignKey) {
        keys.push('FK');
    }
    if (col.unique) {
        keys.push('UK');
    }
    return keys.length > 0 ? ` ${keys.join(',')}` : '';
}

// Function to prepare properties in quotes (e.g., "length: 100, nullable: true") if present
function getColumnProperties(col) {
    let properties = [];
    if (col.length) {
        properties.push(`length: ${col.length}`);
    }
    if (col.nullable === 'true') {
        properties.push('nullable: true');
    } else if (col.nullable === 'false') {
        properties.push('nullable: false');
    }

    return properties.length > 0 ? ` "${properties.join(', ')}"` : '';
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
        const { name, identifying, end1, end2 } = element;
        const from = end1.reference.name;
        const to = end2.reference.name;
        const relationSymbol = determineERrelation(end1.cardinality, end2.cardinality, identifying);
        addRelationshipToBuffer(from, relationSymbol, to, name, relationshipBuffer);
    }

    element.ownedElements?.forEach(ownedElement => {
        processRelationshipRecursive(ownedElement, relationshipBuffer);
    });
}

// Function to get the multiplicity symbol for ER diagrams
function getMultiplicity(m, reverse) {
    switch (m) {
        case '0..1':
            return reverse ? 'o|' : '|o';
        case '1':
            return '||';
        case '0..*':
            return reverse ? 'o{' : '}o';
        case '1..*':
            return reverse ? '|{' : '}|';
        default:
            return ''; // Default empty if type not recognized
    }
}

// Determine the relationship symbol for ER diagrams
function determineERrelation(cardinality1, cardinality2, identifying) {
    const fromMultiplicity = getMultiplicity(cardinality1, false);
    const toMultiplicity = getMultiplicity(cardinality2, true);

    if (!fromMultiplicity || !toMultiplicity) {
        console.warn(`Invalid cardinalities: ${cardinality1}, ${cardinality2}`);
    }

    const relationStrength = identifying ? '--' : '..';
    return `${fromMultiplicity}${relationStrength}${toMultiplicity}`;
}

// Helper to add a relationship to the buffer
function addRelationshipToBuffer(from, relationSymbol, to, label, relationshipBuffer) {
    const relationLabel = label?.trim() ? ` : ${label}` : '';
    relationshipBuffer.push(`${from} ${relationSymbol} ${to}${relationLabel}`);
}

module.exports = { appendERDiagamToMermaid };