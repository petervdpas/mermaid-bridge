// generators/generateSequenceDiagram.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
} = require('../umlFactory');

// Function to generate a Sequence Diagram
function generateSequenceDiagram(project, parsedDiagram) {

    const importSequenceModel = createModel({
        idType: "UMLModel",
        parent: project,
        name: "Imported Sequence Model"
    });

    const collaboration = createModel({
        idType: "UMLCollaboration",
        parent: importSequenceModel,
        name: "Participants"
    });

    const interaction = createModel({
        idType: "UMLInteraction",
        parent: collaboration,
        name: "Interactions"
    });

    const sequenceDiagram = createDiagram({
        idType: "UMLSequenceDiagram",
        parent: interaction,
        name: "Mermaid Sequence Diagram",
        defaultDiagram: true
    });

    // Map to store created lifeline views for reference
    const lifelineViewMap = {};

    // Create lifelines for participants and rename their associated roles
    parsedDiagram.participants.forEach(participant => {
        // Create the lifeline and allow StarUML to automatically generate the associated role
        const lifeline = createModelAndView({
            idType: "UMLLifeline",
            parent: interaction,
            diagram: sequenceDiagram,
            dictionary: {
                name: participant.name || participant.name
            }
        });

        var represent = lifeline.model.represent;
        console.log("Lifeline: ", represent);

        // Rename the auto-generated role linked to the lifeline (if applicable)
        if (represent instanceof type.UMLAttribute) {
            represent.name = participant.name;  // Rename role to participant's name
        }

        // Store the lifeline for later reference in messages
        lifelineViewMap[participant.name] = lifeline;
    });

    /*
    // Create messages between lifelines
    parsedDiagram.messages.forEach(message => {
        const fromLifeline = lifelineViewMap[message.from];
        const toLifeline = lifelineViewMap[message.to];

        // Add a message between lifelines
        createModelAndView({
            idType: "UMLMessage",
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "message",
            nameValue: message.message,
            fromLifeline: fromLifeline,
            toLifeline: toLifeline,
            type: message.type
        });
    });

    // Handle control structures (loops, breaks, alt, etc.)
    parsedDiagram.controlStructures.forEach(controlStructure => {
        createModelAndView({
            idType: `UML${controlStructure.type.charAt(0).toUpperCase() + controlStructure.type.slice(1)}Fragment`,
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "condition",
            nameValue: controlStructure.condition
        });
    });

    // Handle activations and deactivations
    parsedDiagram.activations.forEach(activation => {
        const participantLifeline = lifelineViewMap[activation.participant];

        createModelAndView({
            idType: activation.type === 'activate' ? "UMLActivation" : "UMLDeactivation",
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "participant",
            nameValue: participantLifeline.name
        });
    });

    // Handle notes
    parsedDiagram.notes.forEach(note => {
        const participantLifeline = lifelineViewMap[note.participant];
        
        createModelAndView({
            idType: "UMLNote",
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "note",
            nameValue: note.note,
            position: note.position,  // left or right
            attachedTo: participantLifeline
        });
    });
*/
}

module.exports = { generateSequenceDiagram };