// generators/generateSequenceDiagram.js

const { 
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView
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

    // Step 2: Create Lifelines and Messages
    const lifelineViewMap = {};

    // Create lifelines for each participant in the parsed diagram
    parsedDiagram.participants.forEach((participant, index) => {

        const lifelineView = createPositionedModelAndView({
            idType: "UMLLifeline",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: 50 + (index * 100),
            y1: 20,
            x2: 50 + (index * 100),
            y2: 20,
            dictionary: {
                name: participant.alias || participant.name
            }
        });

        lifelineViewMap[participant.name] = lifelineView;
    });


    // Create messages between lifelines
    parsedDiagram.messages.forEach((message, index) => {
        const fromLifeline = lifelineViewMap[message.from];
        const toLifeline = lifelineViewMap[message.to];

        var reindex = index + 1;

        const messageView = createPositionedDirectedModelAndView({
            idType: "UMLMessage",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: fromLifeline.left,
            y1: fromLifeline.top + (reindex * 50),
            x2: toLifeline.left,
            y2: toLifeline.top + (reindex * 50),
            from: fromLifeline,
            to: toLifeline,
            dictionary: {
                name: message.message,
            }
        });
    });

    /*

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