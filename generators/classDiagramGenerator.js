// generators/classDiagramGenerator.js

const {
    createDiagram,
    createModel,
    createDirectedModelAndView,
    createPositionedModelAndView,
    addClassElement
} = require('../umlFactory');

const CLASS_WIDTH = 100;
const CLASS_HEIGHT = 50;

// Function to create relationships between UML elements
function createClassRelationship(relation, fromView, toView, diagram) {

    if (!diagram || !fromView || !toView) {
        app.toast.error("ClassDiagram, Parent- or child-class is missing.");
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

    const relationView = createDirectedModelAndView({
        idType: elemType,
        parent: diagram._parent,
        diagram: diagram,
        from: fromView,
        to: toView,
        dictionary: {
            name: relation.label || '' // Set the relationship label
        }
    });

    switch (relation.type) {
        case 'directedAssociation':
            relationView.model.end2.navigable = "navigable";
            break;
        case 'bidirectionalAssociation':
            relationView.model.end1.navigable = "navigable";
            relationView.model.end2.navigable = "navigable";
            break;
        case 'aggregation':
            relationView.model.end1.aggregation = "shared";
            break;
        case 'composition':
            relationView.model.end1.aggregation = "composite";
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
    let xPos = 100;
    let yPos = 100;
    const xGap = CLASS_WIDTH * 2;
    const yGap = CLASS_HEIGHT * 2;

    // Create UML classes and add attributes/methods
    parsedDiagram.classes.forEach((cls, index) => {

        xPos = 100 + (index % 3) * xGap; // Move horizontally
        yPos = 100 + Math.floor(index / 3) * yGap; // Move vertically every 3 classes

        const newClass = createPositionedModelAndView({
            idType: "UMLClass",
            parent: classDiagram._parent,
            diagram: classDiagram,
            x1: xPos,
            y1: yPos,
            x2: xPos + CLASS_WIDTH,
            y2: yPos + CLASS_HEIGHT,
            dictionary: {
                name: cls.name
            }
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
        const fromView = classViewMap[rel.from];
        const toView = classViewMap[rel.to];
        createClassRelationship(rel, fromView, toView, classDiagram);
    });

}

module.exports = { generateClassDiagram };
