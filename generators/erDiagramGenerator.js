// generatores/erDiagramGenerator.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
    addERDElement
} = require('../umlFactory');

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
    // parsedDiagram.relationships.forEach(rel => {
    //     const tailView = entityViewMap[rel.to];
    //     const headView = entityViewMap[rel.from];
    //     createRelationship(rel, tailView, headView, erDiagram);
    // });
}

module.exports = { generateERDiagram };