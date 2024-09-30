// generators/erDiagramGenerator.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
    addERDElement
} = require('../umlFactory');

// Function to create relationships between ERD entities
function createERDRelationship(relation, fromView, toView, diagram) {

    if (!diagram || !fromView || !toView) {
        app.toast.error("ERDiagram, Parent- or child-entity is missing.");
        return;
    }

    const options = {
        id: "ERDRelationship",  // General association for now
        parent: diagram._parent,
        diagram: diagram,
        tailView: fromView,
        headView: toView,
        tailModel: fromView.model,
        headModel: toView.model,
        modelInitializer: function (elem) {
            elem.name = relation.label || ''; // Set the relationship label
            elem.identifying = !relation.weak; // Strong relationships are identifying
        }
    };

    const relationView = app.factory.createModelAndView(options);

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

    // Create ERD entities and add fields
    parsedDiagram.entities.forEach(entity => {
        const newEntity = createModelAndView({
            idType: "ERDEntity",
            parent: erDiagram._parent,
            diagram: erDiagram,
            nameKey: "name",
            nameValue: entity.name
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