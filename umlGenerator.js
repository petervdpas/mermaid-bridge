// umlGenerator.js

const { 
    createDiagram, 
    createModel, 
    createModelAndView, 
    createRelationship, 
    addClassElement, 
    addERDElement } = require('./umlFactory');

function generateUML(parsedDiagram) {
    if (!parsedDiagram) {
        app.toast.error("Received NO mermaid code!");
        return;
    }

    // Fetch the project
    const project = app.repository.select("@Project")[0];
    if (!project) {
        app.toast.error("No active project found.");
        return;
    }

    // Handle different types of diagrams
    switch (parsedDiagram.type) {
        case 'classDiagram':
            generateClassDiagram(project, parsedDiagram);
            break;
        
        case 'erDiagram':
            generateERDiagram(project, parsedDiagram);
            break;

        default:
            app.toast.error(`Unsupported diagram type: ${parsedDiagram.type}`);
            return;
    }
}

// Function to generate a Class Diagram
function generateClassDiagram(project, parsedDiagram) {
    const importClassModel = createModel({
        idType: "UMLModel",
        parent: project,
        name: "Imported Class Model"
    });

    const classDiagram = createDiagram({
        idType: "UMLClassDiagram",
        parent: importClassModel,
        name: "Mermaid Class Diagram",
        defaultDiagram: true
    });

    const classViewMap = {};

    // Create UML classes and add attributes/methods
    parsedDiagram.classes.forEach(cls => {
        const newClass = createModelAndView({
            idType: "UMLClass",
            parent: classDiagram._parent,
            diagram: classDiagram,
            nameKey: "name",
            nameValue: cls.name
        });

        classViewMap[cls.name] = newClass;

        cls.attributes.forEach(attr => {
            addClassElement("UMLAttribute", newClass.model, "attributes", attr);
        });

        cls.methods.forEach(method => {
            addClassElement("UMLOperation", newClass.model, "operations", method);
        });
    });

    // Process relationships between classes
    parsedDiagram.relationships.forEach(rel => {
        const tailView = classViewMap[rel.to];
        const headView = classViewMap[rel.from];
        createRelationship(rel, tailView, headView, classDiagram);
    });
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

        entity.attributes.forEach(attr => {
            addERDElement("ERDColumn", newEntity.model, "columns", attr);
        });
    });

    // Process relationships between entities
    // parsedDiagram.relationships.forEach(rel => {
    //     const tailView = entityViewMap[rel.to];
    //     const headView = entityViewMap[rel.from];
    //     createRelationship(rel, tailView, headView, erDiagram);
    // });
}

module.exports = { generateUML };
