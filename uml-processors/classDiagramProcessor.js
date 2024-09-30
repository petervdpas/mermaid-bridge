// uml-processors/classDiagramProcessor.js

const {
    mapClassVisibilityToSymbol,
    isClassRelationNavigable
} = require('../utils/utils');


// Function to append classes/entities and relationships to Mermaid code
function appendClassDiagamToMermaid(model) {
    let mermaidElements = 'classDiagram\n';

    const classMap = generateClassDefinitions(model);
    const relationshipBuffer = generateRelationships(model);

    // Append classes/entities to Mermaid code
    classMap.forEach(classDef => {
        mermaidElements += classDef;
    });

    // Append relationships to Mermaid code
    relationshipBuffer.forEach(relation => {
        mermaidElements += `${relation}\n`;
    });

    return mermaidElements;
}

// Function to generate class definitions
function generateClassDefinitions(model) {
    const classMap = new Map();

    model.ownedElements.forEach(element => {
        if (element instanceof type.UMLClass) {
            let classDef = `  class ${element.name} {\n`;

            // Handle attributes
            element.attributes.forEach(attr => {
                classDef += `    ${mapClassVisibilityToSymbol(attr.visibility)} ${attr.type} ${attr.name}\n`;
            });

            // Handle methods
            element.operations.forEach(op => {
                classDef += `    ${mapClassVisibilityToSymbol(op.visibility)} void ${op.name}()\n`;
            });

            classDef += `  }\n`;
            classMap.set(element._id, classDef);
        }
    });

    return classMap;
}

// Function to generate relationships
function generateRelationships(model) {
    const relationshipBuffer = [];

    model.ownedElements.forEach(element => {
        processRelationshipRecursive(element, relationshipBuffer);
    });

    return relationshipBuffer;
}

// Process relationships recursively (associations, generalizations, etc.)
function processRelationshipRecursive(element, relationshipBuffer) {
    if (element instanceof type.UMLAssociation) {
        processAssociation(element, relationshipBuffer);
    } else if (element instanceof type.UMLGeneralization) {
        processGeneralization(element, relationshipBuffer);
    }

    // Recursively process owned elements
    element.ownedElements?.forEach(ownedElement => {
        processRelationshipRecursive(ownedElement, relationshipBuffer);
    });
}

// Handle generalization (inheritance) relationships
function processGeneralization(element, relationshipBuffer) {
    const { source: { name: from }, target: { name: to } } = element;
    const relationSymbol = '<|--';  // Inheritance
    addRelationshipToBuffer(from, relationSymbol, to, element.name, relationshipBuffer);
}

// Handle associations (including aggregation and composition)
function processAssociation(element, relationshipBuffer) {
    const { end1, end2 } = element;
    const from = end2.reference.name;
    const to = end1.reference.name;

    // Determine the relationship symbol based on aggregation and navigability
    const relationSymbol = determineAssociationSymbol(end1, end2);
    addRelationshipToBuffer(from, relationSymbol, to, element.name, relationshipBuffer);
}

// Determine the relationship symbol for associations
function determineAssociationSymbol(end1, end2) {
    const end1Aggregation = (end1.aggregation === 'composite') ? '--*' :
                            (end1.aggregation === 'shared') ? '--o' : '--';

    const end2Aggregation = (end2.aggregation === 'composite') ? '*--' :
                            (end2.aggregation === 'shared') ? 'o--' : '--';

    return (isClassRelationNavigable(end1.navigable) && isClassRelationNavigable(end2.navigable)) ? '<-->' :
           isClassRelationNavigable(end1.navigable) ? '-->' :
           isClassRelationNavigable(end2.navigable) ? '<--' :
           end1Aggregation !== '--' ? end1Aggregation :
           end2Aggregation !== '--' ? end2Aggregation : '--';
}

// Helper to add a relationship to the buffer with optional label
function addRelationshipToBuffer(from, relationSymbol, to, label, relationshipBuffer) {
    const relationLabel = label?.trim() ? ` : ${label}` : '';
    relationshipBuffer.push(`${from} ${relationSymbol} ${to}${relationLabel}`);
}

module.exports = { appendClassDiagamToMermaid };