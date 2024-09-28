// mermaidParser.js

function translateVisibility(symbol) {
    switch (symbol) {
        case '+': return 'public';
        case '-': return 'private';
        case '#': return 'protected';
        default: return 'package';
    }
}

function isRelationshipLine(line) {
    const relationshipPatterns = ['<|--', '-->', 'o--', '*--', '--', '<-->'];
    return relationshipPatterns.some(pattern => line.includes(pattern));
}

function parseClassRelationship(line, relationships) {

    const relationshipTypes = [
        { type: 'inheritance', pattern: '<|--' },
        { type: 'aggregation', pattern: 'o--' },
        { type: 'composition', pattern: '*--' },
        { type: 'bidirectionalAssociation', pattern: '<-->' },
        { type: 'directedAssociation', pattern: '-->' },
        { type: 'association', pattern: '--' }
    ];

    // Find the relationship type
    const relationship = relationshipTypes.find(rel => line.includes(rel.pattern));

    if (relationship) {
        const [fromToPart, labelPart] = line.split(':').map(part => part.trim());
        const [from, to] = fromToPart.split(relationship.pattern).map(part => part.trim());
        const label = labelPart || null;

        relationships.push({ from, to, type: relationship.type, label });
    }
}

function parseMermaidToJSON(mermaidCode) {
    const lines = mermaidCode.split('\n').map(line => line.trim());
    const jsonResult = { type: 'classDiagram', classes: [], relationships: [] };

    let currentClass = null;

    // Begin parsing
    lines.forEach(line => {
        if (line.startsWith('class ')) {
            // Add the previous class
            if (currentClass) jsonResult.classes.push(currentClass);
            // Start a new class
            currentClass = { name: line.split(' ')[1], attributes: [], methods: [] };
        } else if (line.startsWith('+') || line.startsWith('-') || line.startsWith('#')) {
            const parts = line.split(/[\s()]+/).filter(Boolean);  // Split on whitespace and parentheses

            if (parts.length >= 2) {
                const visibility = translateVisibility(parts[0][0]);
                const name = parts[1];
                const type = parts[0].substring(1);  // Remove the visibility symbol

                if (line.includes('()')) {
                    // Its a method
                    const parameters = line.match(/\((.*?)\)/)[1].split(',').map(param => param.trim());
                    currentClass.methods.push({ visibility, name, returnType: type, parameters });
                } else {
                    // Its an attribute
                    currentClass.attributes.push({ visibility, name, type });
                }
            }
        } else if (isRelationshipLine(line)) {
            // Process relationship
            parseClassRelationship(line, jsonResult.relationships);
        }
    });

    // Add the last class
    if (currentClass) jsonResult.classes.push(currentClass);

    return jsonResult;
}

module.exports = { parseMermaidToJSON };
