// generators/generateSequenceDiagram.js

const { positionTracker } = require('../utils/utils');
const {
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView
} = require('../umlFactory');

const LIFELINE_MARGIN = 80;
const LIFELINE_NAME_MARGIN = 10;
const MESSAGE_HEIGHT = 64;
const CONTROL_STRUCTURE_HEADER_HEIGHT = 10;
const CONTROL_STRUCTURE_GAP = 20; 

const lifelinePositionMap = {};
const lifelineViewMap = {};

// Initialize position and dimension trackers
const lifelinePositionTracker = positionTracker({ xPos: 50, yPos: 20 });
const messagePositionTracker = positionTracker({ xPos: 0, yPos: 50 }, 0, MESSAGE_HEIGHT);

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

    let accumulatedMargin = 0;
    
    // Create lifelines for each participant in the parsed diagram
    parsedDiagram.participants.forEach((participant) => {

        let participantAlias = participant.alias || participant.name;
        let nameLength = participantAlias.length;

        // Use position tracker to set X positions dynamically
        const { xPos, yPos } = lifelinePositionTracker.getPosition();

        const lifelineView = createPositionedModelAndView({
            idType: "UMLLifeline",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: xPos + accumulatedMargin,
            y1: yPos,
            x2: xPos + accumulatedMargin,
            y2: yPos,
            dictionary: {
                name: participantAlias
            }
        });

        const role = lifelineView.model.represent;
        if (role) {
            app.engine.setProperty(role, 'name', participant.name);
        }

        lifelinePositionMap[participant.name] = { left: xPos, top: yPos };

        lifelineViewMap[participant.name] = lifelineView;

        // Increment margin based on lifeline margin and name length
        accumulatedMargin += LIFELINE_MARGIN + (nameLength + LIFELINE_NAME_MARGIN);

        // Increment X position for the next participant
        lifelinePositionTracker.incrementPosition(accumulatedMargin, 0);
    });

    // Handle control structures and messages
    handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap);
}


// Function to handle control structures and their associated messages
function handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap) {

    while (parsedDiagram.messages.length > 0) {
        const message = parsedDiagram.messages[0];

        const controlStructure = parsedDiagram.controlStructures.find(
            cs => cs.controlStructureId === message.controlStructureId);

        if (controlStructure) {
            drawControlStructure(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram);
            removeControlStructure(parsedDiagram, controlStructure.controlStructureId);
        } else {
            drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram);
        }
    }
}

// Function to draw a combined fragment (e.g., alt, opt, break) and its messages
function drawMessages(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram) {

    // Draw messages inside the control structure
    controlStructure.messages.forEach((messageId) => {
        const message = parsedDiagram.messages.find(msg => msg.messageId === messageId);
        if (message) {
            drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram);
        }
    });

    // Handle the alternatives if present
    if (controlStructure.alternatives && Array.isArray(controlStructure.alternatives)) {
        controlStructure.alternatives.forEach((elseBranch) => {
            elseBranch.messages.forEach((messageId) => {
                const message = parsedDiagram.messages.find(msg => msg.messageId === messageId);
                if (message) {
                    drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram);
                }
            });
        });
    }
}

// Function to draw a fragment and calculate height based on the number of messages
function drawControlStructure(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram) {

    // Save the current Y position to return to it after drawing the fragment
    const originalYPos = messagePositionTracker.getPosition().yPos;

    // Calculate the height of the fragment
    const fragmentHeight = calculateFragmentHeight(controlStructure);

    const { mostLeft, mostRight } = getInvolvedLifelinesHorizontalBoundary(controlStructure, lifelineViewMap, parsedDiagram);
    console.log("Most left: ", mostLeft, "Most right: ", mostRight);

    const yPos1 = originalYPos + CONTROL_STRUCTURE_GAP;
    const yPos2 = yPos1 + fragmentHeight;

    const combinedFragment = createPositionedModelAndView({
        idType: "UMLCombinedFragment",
        parent: sequenceDiagram._parent,
        diagram: sequenceDiagram,
        x1: mostLeft,
        y1: yPos1,
        x2: mostRight,
        y2: yPos2 + CONTROL_STRUCTURE_GAP + CONTROL_STRUCTURE_HEADER_HEIGHT,
        dictionary: {
            name: controlStructure.type + " Fragment"
        }
    });

    app.engine.setProperty(combinedFragment.model, 'interactionOperator', controlStructure.type);

    combinedFragment.model.operands.forEach(operand => {
        app.engine.setProperty(operand, 'name', controlStructure.condition);
        app.engine.setProperty(operand, 'guard', controlStructure.condition);
    });

    // Now reset the Y position back to the top of the fragment (yPos1) to place the messages
    messagePositionTracker.setPosition({ xPos: messagePositionTracker.getPosition().xPos, yPos: yPos1 });
    
    // Draw the messages in the fragment
    drawMessages(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram);

    // Once all messages in the fragment are drawn, update the position tracker for future elements below the fragment
    messagePositionTracker.setPosition({ xPos: messagePositionTracker.getPosition().xPos, yPos: yPos2 + CONTROL_STRUCTURE_GAP });
}

// Function to draw a message
function drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram) {

    const { yPos } = messagePostionTrackerUpdate();

    const fromLifeline = lifelineViewMap[message.from];
    const toLifeline = lifelineViewMap[message.to];

    const fromX = lifelinePositionMap[message.from].left;
    const toX = lifelinePositionMap[message.to].left;

    // Extend lifelines if necessary
    extendLifelinesHeight(lifelineViewMap, yPos);

    createPositionedDirectedModelAndView({
        idType: "UMLMessage",
        parent: sequenceDiagram._parent,
        diagram: sequenceDiagram,
        x1: fromX,
        y1: yPos,
        x2: toX,
        y2: yPos,
        from: fromLifeline,
        to: toLifeline,
        dictionary: {
            name: message.message,
            messageSort: message.type
        }
    });

    removeMessageById(parsedDiagram, message.messageId);
}

// Function to remove a message from parsedDiagram.messages by messageId
function removeMessageById(parsedDiagram, messageId) {
    const messageIndex = parsedDiagram.messages.findIndex(msg => msg.messageId === messageId);
    if (messageIndex > -1) {
        parsedDiagram.messages.splice(messageIndex, 1);  // Remove the message from the array
    }
}

// Function to remove a control structure from parsedDiagram
function removeControlStructure(parsedDiagram, controlStructureId) {
    const controlStructureIndex = parsedDiagram.controlStructures.findIndex(cs => cs.controlStructureId === controlStructureId);
    if (controlStructureIndex > -1) {
        parsedDiagram.controlStructures.splice(controlStructureIndex, 1);  // Remove the control structure from the array
    }
}

// Helper function to calculate the height of the fragment based on the number of messages, including alternatives
function calculateFragmentHeight(controlStructure) {
    let totalMessages = controlStructure.messages.length;

    if (controlStructure.alternatives && Array.isArray(controlStructure.alternatives)) {
        controlStructure.alternatives.forEach(alt => {
            totalMessages += alt.messages.length;
        });
    }

    return CONTROL_STRUCTURE_HEADER_HEIGHT + (totalMessages * MESSAGE_HEIGHT);
}

// Function to update the position tracker for messages
function messagePostionTrackerUpdate() {
    messagePositionTracker.incrementPosition(0, MESSAGE_HEIGHT);
    return messagePositionTracker.getPosition();
}

// Helper function to extend all lifelines' height if the Y position exceeds their current height
function extendLifelinesHeight(lifelineViewMap, yPos) {
    let newHeight = yPos - CONTROL_STRUCTURE_HEADER_HEIGHT;
    Object.values(lifelineViewMap).forEach(lifelineView => {
        const currentHeight = lifelineView.height || 0;
        if (yPos > currentHeight) {
            app.engine.setProperty(lifelineView, 'height', newHeight);
        }
    });
}

// Get the horizontal boundaries of the lifelines involved in a control structure
function getInvolvedLifelinesHorizontalBoundary(controlStructure, lifelineViewMap, parsedDiagram) {

    let mostLeft = null;
    let mostRight = null;

    controlStructure.messages.forEach(messageId => {
        const message = parsedDiagram.messages.find(msg => msg.messageId === messageId);
        if (message) {
            const fromLifeline = lifelineViewMap[message.from];
            const toLifeline = lifelineViewMap[message.to];

            // Use left edge for mostLeft and right edge for mostRight
            const fromLifelineLeft = fromLifeline.left;
            const toLifelineRight = toLifeline.left + (toLifeline.width || 0);

            // Set initial values for mostLeft and mostRight based on the first lifeline positions found
            if (mostLeft === null || mostRight === null) {
                mostLeft = fromLifelineLeft;
                mostRight = toLifelineRight;
            }

            // Update mostLeft and mostRight to ensure we get the true boundaries
            mostLeft = Math.min(mostLeft, fromLifelineLeft, toLifeline.left);
            mostRight = Math.max(mostRight, fromLifelineLeft + fromLifeline.width, toLifelineRight);
        }
    });

    return {
        mostLeft: mostLeft !== null ? mostLeft : 0,
        mostRight: mostRight !== null ? mostRight : 0
    };
}

module.exports = { generateSequenceDiagram };
