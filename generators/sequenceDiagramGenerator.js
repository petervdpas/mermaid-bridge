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
        const xPosition = currentXPosition + (index * 120); // Improved xPosition logic

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

// Function to handle control structures and their associated messages
function handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap) {
    let currentYPosition = 140;

    while (parsedDiagram.messages.length > 0) {
        const message = parsedDiagram.messages[0]; // Peek at the first message

        const controlStructure = findControlStructureBeforeMessage(
            message.controlStructureId, parsedDiagram.controlStructures);

        if (controlStructure) {
            // Draw the combined fragment for the control structure
            drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram);

            // Remove the control structure after it is used
            parsedDiagram.controlStructures = parsedDiagram.controlStructures.filter(
                cs => cs.controlStructureId !== controlStructure.controlStructureId);

        } else {
            // Draw the message
            drawMessage(sequenceDiagram, message, lifelineViewMap);

            // Remove the message from the list after processing
            parsedDiagram.messages.shift();
        }

        currentYPosition += 50; // Adjusted vertical position increment
    }
}

// Function to draw a combined fragment for a control structure and handle its messages
function drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram) {
    const x1 = 50; // Fixed starting point for fragments
    const fragmentWidth = Math.max(...Object.values(lifelinePositionMap).map(pos => pos.left)) + 200; // Dynamically calculate width
    const y1 = currentYPosition;
    const y2 = currentYPosition + 100;

    const combinedFragment = createPositionedModelAndView({
        idType: "UMLCombinedFragment",
        parent: sequenceDiagram._parent,
        diagram: sequenceDiagram,
        x1: x1,
        y1: y1,
        x2: fragmentWidth, // Use dynamically calculated width
        y2: y2,
        dictionary: {
            name: controlStructure.type,
            condition: controlStructure.condition
        }
    });

    currentYPosition += 100;

    // If there are alternative branches (e.g., else), handle the messages for each branch
    if (controlStructure.alternatives && controlStructure.alternatives.length > 0) {
        controlStructure.alternatives.forEach(altStructure => {
            const altMessages = findMessagesByControlStructureId(altStructure.controlStructureId, parsedDiagram.messages);

            altMessages.forEach(message => {
                drawMessage(sequenceDiagram, message, lifelineViewMap);
                parsedDiagram.messages = parsedDiagram.messages.filter(msg => msg !== message);
                currentYPosition += 50;
            });
        });
    } else {
        // Draw only the messages that belong to this control structure
        const relatedMessages = findMessagesByControlStructureId(controlStructure.controlStructureId, parsedDiagram.messages);

        relatedMessages.forEach(message => {
            drawMessage(sequenceDiagram, message, lifelineViewMap);
            parsedDiagram.messages = parsedDiagram.messages.filter(msg => msg !== message);
            currentYPosition += 50;
        });
    }

    currentYPosition += 100; // After all messages in this fragment, move the Y position down
}

// Helper function to find a control structure before a specific message
function findControlStructureBeforeMessage(controlStructureId, controlStructures) {
    return controlStructures.find(cs => cs.controlStructureId === controlStructureId);
}

// Helper function to find messages associated with a control structure
function findMessagesByControlStructureId(controlStructureId, messages) {
    return messages.filter(msg => msg.controlStructureId === controlStructureId);
}

// Function to draw a message
function drawMessage(sequenceDiagram, message, lifelineViewMap) {
    const fromLifeline = lifelineViewMap[message.from];
    const toLifeline = lifelineViewMap[message.to];

    const fromX = lifelinePositionMap[message.from].left;
    const toX = lifelinePositionMap[message.to].left;

    createPositionedDirectedModelAndView({
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

    currentYPosition += 50; // Ensure consistent vertical spacing
}

module.exports = { generateSequenceDiagram };
