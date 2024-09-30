// generators/generateSequenceDiagram.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
    addERDElement
} = require('../umlFactory');

// Function to generate a Sequence Diagram
function generateSequenceDiagram(project, parsedDiagram) {

    const importSequenceModel = createModel({
        idType: "UMLModel",
        parent: project,
        name: "Imported Sequence Model"
    });

    const sequenceDiagram = createDiagram({
        idType: "UMLSequenceDiagram",
        parent: importSequenceModel,
        name: "Mermaid Sequence Diagram",
        defaultDiagram: true
    });

    // const lifelineViewMap = {};

    // // Create UML classes and add attributes/methods
    // parsedDiagram.lifelines.forEach(lifeline => {
    //     const newLifeline = createModelAndView({
    //         idType: "UMLLifeline",
    //         parent: sequenceDiagram._parent,
    //         diagram: sequenceDiagram,
    //         nameKey: "name",
    //         nameValue: lifeline.name
    //     });

    //     lifelineViewMap[lifeline.name] = newLifeline;

    //     lifeline.messages.forEach(message => {
    //         addSequenceElement("UMLAttribute", newClass.model, "attributes", attr);
    //     });
    // });
}

module.exports = { generateSequenceDiagram };