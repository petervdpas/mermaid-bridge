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

const sequenceDiagramArrows = {
    arrows: [
        { type: 'synchCall', pattern: '->', description: 'Solid line without arrow' },
        { type: 'asynchCall', pattern: '->>', description: 'Solid line with arrowhead' },
        { type: 'synchCall', pattern: '-->', description: 'Dotted line without arrow' },
        { type: 'asynchSignal', pattern: '-->>', description: 'Dotted line with arrowhead' },
        { type: 'synchCall', pattern: '<<->>', description: 'Solid line with bidirectional arrowheads' },
        { type: 'synchCall', pattern: '<<-->>', description: 'Dotted line with bidirectional arrowheads' },
        { type: 'deleteMessage', pattern: '-x', description: 'Solid line with a cross at the end' },
        { type: 'deleteMessage', pattern: '--x', description: 'Dotted line with a cross at the end' },
        { type: 'asynchSignal', pattern: '-)', description: 'Solid line with open arrow at the end (async)' },
        { type: 'asynchSignal', pattern: '--)', description: 'Dotted line with open arrow at the end (async)' },
    ]
};

// Function to translate SQL data types into StarUML/ERD types
function translateSQLToERDType(sqlType) {
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

// Function to translate StarUML/ERD types back into SQL data types
function translateERDToSQLType(erdType) {
    switch (erdType.toUpperCase()) {
        case 'INTEGER':
            return 'int';  // Translate to SQL integer
        case 'BIGINT':
            return 'bigint';  // Translate to SQL bigint
        case 'SMALLINT':
            return 'smallint';  // Translate to SQL smallint
        case 'BIT':
            return 'tinyint';  // Translate to SQL tinyint
        case 'DECIMAL':
            return 'decimal';  // Translate to SQL decimal
        case 'FLOAT':
            return 'float';  // Translate to SQL float
        case 'DOUBLE':
            return 'double';  // Translate to SQL double
        case 'CHAR':
            return 'char';  // Translate to SQL char
        case 'VARCHAR':
            return 'varchar';  // Translate to SQL varchar
        case 'BINARY':
            return 'binary';  // Translate to SQL binary
        case 'VARBINARY':
            return 'varbinary';  // Translate to SQL varbinary
        case 'BLOB':
            return 'blob';  // Translate to SQL blob
        case 'DATE':
            return 'date';  // Translate to SQL date
        case 'TIME':
            return 'time';  // Translate to SQL time
        case 'DATETIME':
            return 'datetime';  // Translate to SQL datetime
        case 'TIMESTAMP':
            return 'timestamp';  // Translate to SQL timestamp
        case 'BOOLEAN':
            return 'boolean';  // Translate to SQL boolean
        case 'GEOMETRY':
            return 'geometry';  // Translate to SQL geometry
        default:
            return erdType;  // If no match is found, use the original type
    }
}

// Helper function to generate a GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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

// Helper function to identify the start or end of a metadata block
function isMetadataBlockStartOrEnd(line) {
    return line === '---';
}

// Helper function to identify single-line comments
function isCommentLine(line) {
    return line.startsWith('%%');
}

// Helper function to skip metadata block and comment lines
function skipMetadataAndCommentLines(lines) {
    let insideMetadataBlock = false;
    return lines.filter(line => {
        // Check if we are at the start or end of a metadata block
        if (isMetadataBlockStartOrEnd(line)) {
            insideMetadataBlock = !insideMetadataBlock; // Toggle metadata block status
            return false; // Skip metadata block markers
        }

        // Check if we are inside a metadata block or if the line is a comment
        if (insideMetadataBlock || isCommentLine(line)) {
            return false; // Skip lines inside metadata block or comments
        }

        // Return true for lines that are valid for processing (non-metadata, non-comment)
        return line.trim().length > 0; // Only keep non-empty, valid lines
    });
}

// Helper function to determine the type of diagram
function determineDiagramType(filteredLines) {
    
    const diagramTypes = {
        classDiagram: /^classDiagram/,
        erDiagram: /^erDiagram/,
        sequenceDiagram: /^sequenceDiagram/
    };

    // Iterate over filtered lines to identify the diagram type
    for (const line of filteredLines) {
        // Check the line for a diagram type
        for (const [type, pattern] of Object.entries(diagramTypes)) {
            if (pattern.test(line)) {
                return type;
            }
        }
    }

    throw new Error("Unsupported or unrecognized diagram type.");
}

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
    sequenceDiagramArrows,
    translateSQLToERDType,
    translateERDToSQLType,
    generateGUID,
    mapSymbolToClassVisibility, 
    mapClassVisibilityToSymbol,
    skipMetadataAndCommentLines,
    determineDiagramType,
    shouldIgnoreLine,
    isRelationshipLine,
    isClassRelationNavigable
};
