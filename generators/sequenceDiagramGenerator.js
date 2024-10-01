// generators/generateSequenceDiagram.js

const { 
    createDiagram,
    createModel,
    createModelAndView,
    createModelAndViewDictionary
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

    // Create lifelines for participants
    parsedDiagram.participants.forEach(participant => {

        // Step 1: Create the role (UMLAttribute)
        const role = createModel({
            idType: "UMLAttribute",
            parent: collaboration,
            name: participant.name  // E.g., "User", "System", "DB"
        });

        // Step 2: Create the lifeline (UMLLifeline) and reference the role
        const lifelineDict = createModelAndViewDictionary({
            idType: "UMLLifeline",
            parent: interaction,
            diagram: sequenceDiagram,
            dictionary: {
                name: participant.alias || participant.name,  // E.g., "Alice"
                represent: role  // Reference the role (UMLAttribute)
            }
        });

        Object.assign(lifelineViewMap, lifelineDict);
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