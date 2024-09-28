// umlProcess.js

function convertToMermaid(model) {
    let mermaidCode = 'classDiagram\n';
    const classMap = new Map();
    const relationshipBuffer = [];

    // Process classes and attributes/methods
    model.ownedElements.forEach(element => {
        if (element instanceof type.UMLClass) {
            let classDef = `  class ${element.name} {\n`;

            // Handle attributes
            element.attributes.forEach(attr => {
                classDef += `    ${translateVisibility(attr.visibility)} ${attr.type} ${attr.name}\n`;
            });

            // Handle methods
            element.operations.forEach(op => {
                classDef += `    ${translateVisibility(op.visibility)} void ${op.name}()\n`;
            });

            classDef += `  }\n`;
            classMap.set(element._id, classDef);
        }

        // Collect relationships
        processRelationshipRecursive(element, relationshipBuffer);
    });

    // Append classes to Mermaid code
    classMap.forEach(classDef => {
        mermaidCode += classDef;
    });

    // Append relationships at the bottom
    relationshipBuffer.forEach(relation => {
        mermaidCode += `${relation}\n`;
    });

    return mermaidCode;
}

// Separate function to process relationships recursively
function processRelationshipRecursive(element, relationshipBuffer) {
    if (element instanceof type.UMLAssociation || element instanceof type.UMLGeneralization) {
        let relationSymbol = '--';
        let from, to;

        if (element instanceof type.UMLGeneralization) {
            ({ source: { name: from }, target: { name: to } } = element);
            relationSymbol = '<|--';  // inheritance
        } else {
            ({ end1: { reference: { name: to }, aggregation }, end2: { reference: { name: from }, navigable } } = element);

            // Determine relationship type
            relationSymbol = (element.end2.aggregation === 'composite') ? '*--' :
                             (element.end2.aggregation === 'shared') ? 'o--' :
                             (checkNavigable(element.end1.navigable) && checkNavigable(element.end2.navigable)) ? '<-->' :
                             (checkNavigable(element.end1.navigable)) ? '-->' : '--';
        }

        // Add relationship label if present
        const relationLabel = element.name?.trim() ? ` : ${element.name}` : '';
        relationshipBuffer.push(`${from} ${relationSymbol} ${to}${relationLabel}`);
    }

    // Recursively process owned elements
    element.ownedElements?.forEach(ownedElement => {
        processRelationshipRecursive(ownedElement, relationshipBuffer);
    });
}

// Helper function for navigable check
const checkNavigable = navigable => navigable === "navigable";

// Helper function to translate visibility
const translateVisibility = visibility => ({
    'public': '+',
    'private': '-',
    'protected': '#',
    '~': '~'
}[visibility] || '~');

module.exports = { convertToMermaid };
