// generators/erDiagramGenerator.js

const { 
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createDirectedModelAndView,
    addERDElement
} = require('../umlFactory');

const ENTITY_WIDTH = 80;
const ENTITY_HEIGHT = 40;

// Function to create relationships between ERD entities
function createERDRelationship(relation, fromView, toView, diagram) {

    if (!diagram || !fromView || !toView) {
        app.toast.error("ERDiagram, Parent- or child-entity is missing.");
        return;
    }

    const relationView = createDirectedModelAndView({
        idType: "ERDRelationship",
        parent: diagram._parent,
        diagram: diagram,
        from: fromView,
        to: toView,
        dictionary: {
            name: relation.label || '',
            identifying: !relation.weak
        }
    });

    // Assign multiplicity based on the fromType and toType
    relationView.model.end1.cardinality = getMultiplicity(relation.fromType);
    relationView.model.end2.cardinality = getMultiplicity(relation.toType);
}

// Helper function to translate types (like `ZeroOrOne`) into multiplicity values
function getMultiplicity(type) {
    switch (type) {
        case 'ZeroOrOne':
            return '0..1';
        case 'ExactlyOne':
            return '1';
        case 'ZeroOrMany':
            return '0..*';
        case 'OneOrMany':
            return '1..*';
        default:
            return ''; // Default empty if type not recognized
    }
}

// Function to generate an ER Diagram
function generateERDiagram(project, parsedDiagram) {

    const importEntityModel = createModel({
        idType: "ERDDataModel",
        parent: project,
        name: "Imported ERD Model"
    });

    const erDiagram = createDiagram({
        idType: "ERDDiagram",
        parent: importEntityModel,
        name: "Mermaid ER Diagram",
        defaultDiagram: true
    });

    const entityViewMap = {};
    let xPos = 100;
    let yPos = 100;
    const xGap = ENTITY_WIDTH * 2;
    const yGap = ENTITY_HEIGHT * 2;

    // Create ERD entities and add fields
    parsedDiagram.entities.forEach((entity, index) => {

        xPos = ENTITY_WIDTH + (index % 3) * xGap;
        yPos = ENTITY_HEIGHT + Math.floor(index / 3) * yGap;

        const newEntity = createPositionedModelAndView({
            idType: "ERDEntity",
            parent: erDiagram._parent,
            diagram: erDiagram,
            x1: xPos,
            y1: yPos,
            x2: xPos + ENTITY_WIDTH,
            y2: yPos + ENTITY_HEIGHT,
            dictionary: {
                name: entity.name
            }
        });

        entityViewMap[entity.name] = newEntity;

        entity.columns.forEach(elements => {
            addERDElement("ERDColumn", newEntity.model, "columns", elements);
        });
    });

    // Process relationships between entities
    parsedDiagram.relationships.forEach(relation => {
        const fromView = entityViewMap[relation.from];
        const toView = entityViewMap[relation.to];
        createERDRelationship(relation, fromView, toView, erDiagram);
    });
}

module.exports = { generateERDiagram };