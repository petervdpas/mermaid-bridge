// generatores/classDiagramGenerator.js

const {
    createDiagram,
    createModel,
    createModelAndView,
    addClassElement
} = require('../umlFactory');

// Function to create relationships between UML elements
function createClassRelationship(relation, tailView, headView, diagram) {

    if (!tailView || !headView) {
        app.toast.error("Parent or child class is missing.");
        return;
    }

    const relationMap = {
        'inheritance': "UMLGeneralization",
        'association': "UMLAssociation",
        'directedAssociation': "UMLAssociation",
        'bidirectionalAssociation': "UMLAssociation",
        'aggregation': "UMLAssociation",
        'composition': "UMLAssociation"
    };

    let elemType = relationMap[relation.type];

    if (!elemType) {
        app.toast.error(`Unknown relationship type: ${relation.type}`);
        console.warn(`Unknown relationship type: ${relation.type}`);
        return;
    }

    const options = {
        id: elemType,
        parent: diagram._parent,
        diagram: diagram,
        tailView: tailView,
        headView: headView,
        tailModel: tailView.model,
        headModel: headView.model,
        modelInitializer: function (elem) {
            elem.name = relation.label || '';
        }
    };

    const relationView = app.factory.createModelAndView(options);

    switch (relation.type) {
        case 'directedAssociation':
            relationView.model.end1.navigable = "navigable";
            break;
        case 'bidirectionalAssociation':
            relationView.model.end1.navigable = "navigable";
            relationView.model.end2.navigable = "navigable";
            break;
        case 'aggregation':
            relationView.model.end2.aggregation = "shared";
            break;
        case 'composition':
            relationView.model.end2.aggregation = "composite";
            break;
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
        createClassRelationship(rel, tailView, headView, classDiagram);
    });
}

module.exports = { generateClassDiagram };
