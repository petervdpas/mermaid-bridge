// umlProcess.js

function convertToMermaid(model) {

    let mermaidCode = 'classDiagram\n';

    // Map to store classes
    const classMap = new Map();
    const relationshipBuffer = [];  // Store relationships here to add later

    // First pass: handle classes and attributes/methods
    model.ownedElements.forEach(element => {
        if (element instanceof type.UMLClass) {
            let classDef = `  class ${element.name} {\n`;
            
            // Handle attributes
            element.attributes.forEach(attr => {
                classDef += `    ${translateVisibility(attr.visibility)}${attr.type} ${attr.name}\n`;
            });
            
            // Handle methods
            element.operations.forEach(op => {
                classDef += `    ${translateVisibility(op.visibility)}void ${op.name}()\n`;
            });
            
            classDef += `}\n`;
            classMap.set(element._id, classDef);
        }

        // Collect relationships
        processRelationshipRecursive(element, relationshipBuffer);
    });

    // Append classes to Mermaid code
    if (classMap.size >= 1) {
        classMap.forEach((classDef) => {
            mermaidCode += classDef;
        });
    }

    // Append relationships at the bottom
    if (relationshipBuffer.length >= 1) {
        relationshipBuffer.forEach((relation) => {
            mermaidCode += `${relation}\n`;
        });
    }


    return mermaidCode;
}

// Separate function to process relationships
function processRelationshipRecursive(element, relationshipBuffer) {

    if (element instanceof type.UMLAssociation || element instanceof type.UMLGeneralization) {
        console.log(element);

        let relationSymbol = '--';
        let relationLabel = '';

        var from = '';
        var to = '';

        if (element instanceof type.UMLGeneralization)
        {
            from = element.source.name;
            to = element.target.name;
            relationSymbol = '<|--';  // inheritance

        } else {

            from = element.end1.reference.name;
            to = element.end2.reference.name;
            if (element.end2.aggregation === 'composite') {
                relationSymbol = '*--';   // composition
            } else if (element.end2.aggregation === 'shared') {
                relationSymbol = 'o--';   // aggregation
            } else if (checkNavigable(element.end1.navigable)) {
                relationSymbol = '-->';  // bidirectional association
            } else if (checkNavigable(element.end1.navigable) && checkNavigable(element.end2.navigable)) {
                relationSymbol = '-->';   // directed association
            }
        }
        
        // Check if the relationship has a label (e.g., friendship, chases)
        if (element.name && element.name.trim().length > 0) {
            relationLabel = ` : ${element.name}`;
        }

        // Add the relationship to the buffer to append later
        relationshipBuffer.push(`${to} ${relationSymbol} ${from}${relationLabel}`);
    }

    // Recursively check the owned elements of the current element
    if (element.ownedElements && element.ownedElements.length > 0) {
        element.ownedElements.forEach(ownedElement => {
            processRelationshipRecursive(ownedElement, relationshipBuffer);
        });
    }
}

// Helper function for navigable
function checkNavigable(navigable) {
    navigable === "navigable" ? true : false;
}

// Helper function to translate visibility
function translateVisibility(visibility) {
    switch (visibility) {
        case 'public': return '+';
        case 'private': return '-';
        case 'protected': return '#';
        default: return '~';
    }
}

module.exports = { convertToMermaid };
