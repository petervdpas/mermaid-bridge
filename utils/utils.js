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
        { type: 'Connector', pattern: '--' },
        { type: 'WeakConnector', pattern: '..' },
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

// Function to parse class diagram relationships
function parseClassDiagramRelationship(line, relationships) {
    const relationship = relationshipTypes['classDiagram'].find(rel => line.includes(rel.pattern));
    if (relationship) {
        const [fromToPart, labelPart] = line.split(':').map(part => part.trim());
        const [from, to] = fromToPart.split(relationship.pattern).map(part => part.trim());
        const label = labelPart || null;

        // Push the parsed relationship into the array
        relationships.push({
            from: from,
            to: to,
            type: relationship.type,
            label: label
        });
    } else {
        console.warn(`Could not parse class diagram relationship: ${line}`);
    }
}

// Function to parse ER diagram relationships
function parseERDiagramRelationship(line, relationships) {
    let leftType = null;
    let rightType = null;
    let connector = null;

    // Split the line into the relationship part and the label part (after the colon)
    const [relationshipPart, labelPart] = line.split(':').map(part => part.trim());
    const label = labelPart || null;  // The label (e.g., "uses")

    // First, find the connector (either solid or weak)
    const connectorPattern = relationshipTypes['erDiagram'].find(rel =>
        relationshipPart.includes(rel.pattern) && (rel.type === 'Connector' || rel.type === 'WeakConnector')
    );
    if (connectorPattern) {
        connector = connectorPattern.pattern;
    }

    if (!connector) {
        console.warn(`No connector found in line: ${line}`);
        return;
    }

    // Extract the left and right side of the relationship (before and after the connector)
    const [fromSide, toSide] = relationshipPart.split(connector).map(part => part.trim());

    // Find the left pattern (before the connector)
    const leftPattern = relationshipTypes['erDiagram'].find(rel => fromSide.endsWith(rel.pattern));
    if (leftPattern) {
        leftType = leftPattern.type;
    }

    // Find the right pattern (after the connector)
    const rightPattern = relationshipTypes['erDiagram'].find(rel => toSide.startsWith(rel.pattern));
    if (rightPattern) {
        rightType = rightPattern.type;
    }

    // Remove patterns from `from` and `to` entities
    const from = fromSide.replace(leftPattern ? leftPattern.pattern : '', '').trim();
    const to = toSide.replace(rightPattern ? rightPattern.pattern : '', '').trim();

    if (leftType && rightType && from && to) {
        // Determine if it's a weak relationship based on the connector
        const isWeak = connector === '..';

        // Push the relationship into the array with fromType, toType, label, and weak flag
        relationships.push({
            from: from,               // The "from" entity
            fromType: leftType,       // The type of the "from" entity (e.g., ZeroOrOne, ExactlyOne)
            to: to,                   // The "to" entity
            toType: rightType,        // The type of the "to" entity (e.g., ZeroOrMany, OneOrMany)
            label: label,             // The relationship label (e.g., "places", "uses")
            weak: isWeak              // Flag indicating if it's a weak relationship (dashed line)
        });
    } else {
        console.warn(`Could not parse ER diagram relationship: ${line}`);
    }
}

module.exports = { 
    translateType, 
    translateVisibility, 
    shouldIgnoreLine,
    isRelationshipLine, 
    parseRelationship, 
    parseClassDiagramRelationship,
    parseERDiagramRelationship
};
