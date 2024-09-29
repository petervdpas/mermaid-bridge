// generatores/erDiagramGenerator.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
    addERDElement
} = require('../umlFactory');

// Function to create relationships between ERD entities
function createERDRelationship(relation, tailView, headView, diagram) {

    if (!tailView || !headView) {
        app.toast.error("Parent or child entity is missing.");
        return;
    }

    const options = {
        id: "ERDAssociation",  // General association for now
        parent: diagram._parent,
        diagram: diagram,
        tailView: tailView,
        headView: headView,
        tailModel: tailView.model,
        headModel: headView.model,
        modelInitializer: function (elem) {
            elem.name = relation.label || ''; // Set relationship label if exists
            elem.stereotype = relation.weak ? 'weak' : '';  // Apply "weak" stereotype if relevant
        }
    };

    const relationView = app.factory.createModelAndView(options);

    // Assign multiplicity based on the fromType and toType
    relationView.model.end1.multiplicity = getMultiplicity(relation.fromType);
    relationView.model.end2.multiplicity = getMultiplicity(relation.toType);
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

        entity.attributes.forEach(elements => {
            addERDElement("ERDColumn", newEntity.model, "columns", elements);
        });
    });

    // Process relationships between entities
    parsedDiagram.relationships.forEach(rel => {
        const tailView = entityViewMap[rel.to];
        const headView = entityViewMap[rel.from];
        createERDRelationship(rel, tailView, headView, erDiagram);
    });
}

module.exports = { generateERDiagram };