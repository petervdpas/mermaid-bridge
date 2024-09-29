// utils.js

// Function to translate SQL data types into StarUML/ERD types
function translateType(sqlType) {
    switch (sqlType.toLowerCase()) {
        case 'int':
        case 'integer':
            return 'INTEGER';  // Translate to INTEGER
        case 'bigint':
            return 'BIGINT';  // Translate to BIGINT
        case 'smallint':
            return 'SMALLINT';  // Translate to SMALLINT
        case 'tinyint':
        case 'bit':
            return 'BIT';  // Translate to BIT
        case 'decimal':
        case 'numeric':
            return 'DECIMAL';  // Translate to DECIMAL
        case 'float':
        case 'real':
            return 'FLOAT';  // Translate to FLOAT
        case 'double':
            return 'DOUBLE';  // Translate to DOUBLE
        case 'char':
        case 'nchar':
            return 'CHAR';  // Translate to CHAR
        case 'varchar':
        case 'nvarchar':
        case 'text':
            return 'VARCHAR';  // Translate to VARCHAR
        case 'binary':
            return 'BINARY';  // Translate to BINARY
        case 'varbinary':
            return 'VARBINARY';  // Translate to VARBINARY
        case 'blob':
            return 'BLOB';  // Translate to BLOB
        case 'date':
            return 'DATE';  // Translate to DATE
        case 'time':
            return 'TIME';  // Translate to TIME
        case 'datetime':
        case 'datetime2':
            return 'DATETIME';  // Translate to DATETIME
        case 'timestamp':
            return 'TIMESTAMP';  // Translate to TIMESTAMP
        case 'boolean':
        case 'bool':
            return 'BOOLEAN';  // Translate to BOOLEAN
        case 'geometry':
            return 'GEOMETRY';  // Translate to GEOMETRY
        default:
            return sqlType;  // If no match is found, use the original type
    }
}

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
        { type: 'Connector', pattern: '--' },
        { type: 'ZeroOrOne', pattern: '|o' },
        { type: 'ZeroOrOne', pattern: 'o|' },
        { type: 'ExactlyOne', pattern: '||' },
        { type: 'ZeroOrMore', pattern: '}o' },
        { type: 'ZeroOrMore', pattern: 'o{' },
        { type: 'OneoOrMore', pattern: '}|' },
        { type: 'OneoOrMore', pattern: '|{' },
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

// Utility function to determine if a line should be ignored
function shouldIgnoreLine(line, index, diagramType) {
    const trimmedLine = line.trim();

    // Ignore the diagram declaration line and closing curly braces
    return (index === 0 && trimmedLine === diagramType) || trimmedLine === '}';
}

module.exports = { translateType, translateVisibility, isRelationshipLine, parseRelationship, shouldIgnoreLine };
