// utils.js

const relationshipTypes = {
    classDiagram: [
        { type: 'inheritance', pattern: '<|--' },
        { type: 'aggregation', pattern: 'o--' },
        { type: 'composition', pattern: '*--' },
        { type: 'bidirectionalAssociation', pattern: '<-->' },
        { type: 'directedAssociation', pattern: '-->' },
        { type: 'association', pattern: '--' }
    ],
    erDiagram: [
        { type: 'places', pattern: '||--o{' },
        { type: 'contains', pattern: '||--|{' },
        { type: 'uses', pattern: '}|..|{' }
    ]
};

// Translate visibility symbols to UML visibility keywords
function translateVisibility(symbol) {
    const visibilityMap = {
        '+': 'public',
        '-': 'private',
        '#': 'protected',
        '~': 'package'
    };
    return visibilityMap[symbol] || 'package';
}

// Check if a line contains a relationship pattern
function isRelationshipLine(line, diagramType) {
    const patterns = relationshipTypes[diagramType].map(rel => rel.pattern);
    return patterns.some(pattern => line.includes(pattern));
}

// Parse relationships based on diagram type (classDiagram or erDiagram)
function parseRelationship(line, relationships, diagramType) {
    const relationship = relationshipTypes[diagramType].find(rel => line.includes(rel.pattern));

    if (relationship) {
        const [fromToPart, labelPart] = line.split(':').map(part => part.trim());
        const [from, to] = fromToPart.split(relationship.pattern).map(part => part.trim());
        const label = labelPart || null;

        relationships.push({ from, to, type: relationship.type, label });
    }
}

module.exports = { translateVisibility, isRelationshipLine, parseRelationship };
