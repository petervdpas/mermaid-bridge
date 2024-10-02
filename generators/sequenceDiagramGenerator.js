// generators/generateSequenceDiagram.js

const { 
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView
} = require('../umlFactory');

let currentXPosition = 50;
let currentYPosition = 140;
const aliasMultiplier = 10;
const lifelinePositionMap = {};

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

    const lifelineViewMap = {};

    // Create lifelines for each participant in the parsed diagram
    parsedDiagram.participants.forEach((participant, index) => {
        const participantAlias = participant.alias || participant.name;
        const aliasWidth = participantAlias.length * aliasMultiplier;
        const xPosition = currentXPosition + (index * 120);

        const lifelineView = createPositionedModelAndView({
            idType: "UMLLifeline",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: xPosition,
            y1: 20,
            x2: xPosition,
            y2: 20,
            dictionary: {
                name: participantAlias
            }
        });

        lifelinePositionMap[participant.name] = {
            left: xPosition,
            top: currentYPosition
        };

        const role = lifelineView.model.represent;
        if (role) {
            role.name = participant.name;
        }

        lifelineViewMap[participant.name] = lifelineView;
        currentXPosition += aliasWidth + 50;
    });

    // Handle control structures and messages
    handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap);
}

function  handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap) {

    // Create messages between lifelines
    parsedDiagram.messages.forEach((message, index) => {
        const fromLifeline = lifelineViewMap[message.from];
        const toLifeline = lifelineViewMap[message.to];

        // Get the X positions of the lifelines
        const fromX = lifelinePositionMap[message.from].left;
        const toX = lifelinePositionMap[message.to].left;

        const controlStructure = findControlStructureBeforeMessage(
            message.controlStructureId, parsedDiagram.controlStructures);

        if (controlStructure) {

            console.log("Found control structure before message:", controlStructure);
            parsedDiagram.controlStructures.pop(controlStructure); 
        }
                    
        const messageView = createPositionedDirectedModelAndView({
            idType: "UMLMessage",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: fromX,
            y1: currentYPosition,
            x2: toX,
            y2: currentYPosition,
            from: fromLifeline,
            to: toLifeline,
            dictionary: {
                name: message.message,
                messageSort: message.type
            }
        });

        // Increment the Y position for the next message
        currentYPosition += 50;
    });

}

// Helper function to insert control structures before the corresponding messages
function findControlStructureBeforeMessage(controlStructureId, controlStructures) {
    return controlStructures.find(cs => cs.controlStructureId === controlStructureId);
}

module.exports = { generateSequenceDiagram };