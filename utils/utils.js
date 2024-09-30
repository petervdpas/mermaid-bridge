// utils/utils.js

const relationshipTypes = {
    classDiagram: [
        { type: 'inheritance', pattern: '--|>', flipped: false },
        { type: 'inheritance', pattern: '<|--', flipped: true },
        { type: 'aggregation', pattern: 'o--', flipped: false },
        { type: 'aggregation', pattern: '--o', flipped: true },
        { type: 'composition', pattern: '*--', flipped: false }, 
        { type: 'composition', pattern: '--*', flipped: true },
        { type: 'bidirectionalAssociation', pattern: '<-->', flipped: false },
        { type: 'directedAssociation', pattern: '-->', flipped: false },
        { type: 'directedAssociation', pattern: '<--', flipped: true },
        { type: 'association', pattern: '--', flipped: false }
    ],
    erDiagram: [
        { type: 'IsStrong', pattern: '--' },
        { type: 'IsWeak', pattern: '..' },
        { type: 'ZeroOrOne', pattern: '|o' },
        { type: 'ZeroOrOne', pattern: 'o|' },
        { type: 'ExactlyOne', pattern: '||' },
        { type: 'ZeroOrMany', pattern: '}o' },
        { type: 'ZeroOrMany', pattern: 'o{' },
        { type: 'OneOrMany', pattern: '}|' },
        { type: 'OneOrMany', pattern: '|{' }
    ]
};

// Function to translate SQL data types into StarUML/ERD types
function translateSQLType(sqlType) {
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

// Translate visibility symbols (e.g., +, -, #) to UML visibility keywords (e.g., public, private)
function mapSymbolToClassVisibility(symbol) {
    const visibilityMap = {
        '+': 'public',
        '-': 'private',
        '#': 'protected',
        '~': 'package'
    };
    return visibilityMap[symbol] || 'package';
}

// Helper function to translate UML visibility keywords (e.g., public, private) back to symbols (e.g., +, -, #)
const mapClassVisibilityToSymbol = visibility => ({
    'public': '+',
    'private': '-',
    'protected': '#',
    'package': '~'
}[visibility] || '~');

// Utility function to determine if a line should be ignored
function shouldIgnoreLine(line, index, diagramType) {
    const trimmedLine = line.trim();

    // Ignore the diagram declaration line and closing curly braces
    return (index === 0 && trimmedLine === diagramType) || trimmedLine === '}';
}

// Check if a line contains a relationship pattern
function isRelationshipLine(line, diagramType) {
    const patterns = relationshipTypes[diagramType].map(rel => rel.pattern);
    return patterns.some(pattern => line.includes(pattern));
}

// Helper function for navigable check of a class-relation
function isClassRelationNavigable(navigable) {
    return navigable === "navigable";
}

module.exports = {
    relationshipTypes,
    translateSQLType, 
    mapSymbolToClassVisibility, 
    mapClassVisibilityToSymbol,
    shouldIgnoreLine,
    isRelationshipLine,
    isClassRelationNavigable
};
