// generators/generateSequenceDiagram.js

/*
- draw the lifelines
	- calculate the width of the beginning of first lifeline till the end of the second lifeline
	- calculate the width of the beginning of second lifeline till the end of the third lifeline
	- calculate the width of the beginning of third lifeline till the end of the fourth lifeline
	- etc depending on the number of lifelines and store these values in a map with the first lifeline name as key
- draw a message or a fragment which ever comes first
	- the height of a message is always the same, and width is done by connecting it from and to 2 lifelines
	- the height of a fragment is first determined by a header size and the amount of messages (plus one) in the fragment (including the alternative messages)
	- the width (and the starting position on the X-axis) of a fragment is determined by the space between the most left lifeline and the most right lifeline of the messages in the fragment
- between a message or a fragment which ever comes next, is always a small space (gap) over the Y-axis
- messages in a fragment get set to the position on the Y-axis to the top of their fragment plus its header, so make sure a fragment height can accommodate that
*/

const { positionTracker } = require('../utils/utils');
const {
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView
} = require('../umlFactory');

const LIFELINE_MARGIN = 80;
const LIFELINE_NAME_MARGIN = 10;
const MESSAGE_HEIGHT = 60;
const CONTROL_STRUCTURE_HEADER_HEIGHT = 40;
const CONTROL_STRUCTURE_GAP = 20; 

const lifelinePositionMap = {};
const lifelineViewMap = {};

// Initialize position and dimension trackers
const lifelinePositionTracker = positionTracker({ xPos: 50, yPos: 20 });
const messagePositionTracker = positionTracker({ xPos: 0, yPos: 100 }, 0, MESSAGE_HEIGHT);

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
            // Draw messages for this control structure
            drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram);
        } else {
            drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram);
            
        }
    }
}

// Function to draw a combined fragment's messages (e.g., alt, opt, break)
function drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram) {
    // Draw messages for the main branch of the control structure
    controlStructure.messages.forEach((messageId) => {
        const message = parsedDiagram.messages.find(msg => msg.messageId === messageId);
        if (message) {
            drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram);
        }
    });

    // Handle the else alternatives if present
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

// Function to draw a combined fragment (e.g., alt, opt, break)
function drawFragment(sequenceDiagram, controlStructure, lifelineViewMap) {

    const { xPos1, xPos2 }= getInvolvedLifelinesHorizontalBoundary(controlStructure, lifelineViewMap);
    const yPos1 = messagePositionTracker.getPosition().yPos;
    const yPos2 = yPos1 + calculateFragmentHeight(controlStructure);  // Height is based on the number of messages

    const combinedFragment = createPositionedModelAndView({
        idType: "UMLCombinedFragment",
        parent: sequenceDiagram._parent,
        diagram: sequenceDiagram,
        x1: xPos1,
        y1: yPos1,
        x2: xPos2,
        y2: yPos2,
        dictionary: {
            name: controlStructure.type,
            condition: controlStructure.condition
        }
    });

    // Update position for further elements
    messagePositionTracker.incrementPosition(0, yPos2 - yPos1 + CONTROL_STRUCTURE_GAP);
}

// Function to draw a message
function drawMessage(sequenceDiagram, message, lifelineViewMap, parsedDiagram) {

    const { yPos } = messagePostionTrackerUpdate();

    console.log("Msg: " + message.messageId + " is printed at " + yPos);

    const fromLifeline = lifelineViewMap[message.from];
    const toLifeline = lifelineViewMap[message.to];

    const fromX = lifelinePositionMap[message.from].left;
    const toX = lifelinePositionMap[message.to].left;

    // Extend lifelines if necessary
    extendLifelineHeight(fromLifeline, yPos);
    extendLifelineHeight(toLifeline, yPos);

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

// Function to update the position tracker for messages
function messagePostionTrackerUpdate() {
    messagePositionTracker.incrementPosition(0, MESSAGE_HEIGHT);
    return messagePositionTracker.getPosition();
}

// Helper function to extend a lifeline if the Y position exceeds its current height
function extendLifelineHeight(lifeline, yPos) {
    const lifelineY2 = lifeline.height;

    if (yPos > lifelineY2) {
        app.engine.setProperty(lifeline, 'height', yPos);
    }
}

// Get the horizontal boundary of the lifelines involved in a control structure
function getInvolvedLifelinesHorizontalBoundary(controlStructure, lifelineViewMap) {
    let mostLeft = Infinity;
    let mostRight = -Infinity;

    controlStructure.messages.forEach(messageId => {
        const message = parsedDiagram.messages.find(msg => msg.messageId === messageId);
        if (message) {
            // Calculate the left and right bounds of the 'from' and 'to' lifelines
            const fromLifelineLeft = lifelineViewMap[message.from].left;
            const fromLifelineRight = lifelineViewMap[message.from].right || fromLifelineLeft; // Use right if available
            const toLifelineLeft = lifelineViewMap[message.to].left;
            const toLifelineRight = lifelineViewMap[message.to].right || toLifelineLeft; // Use right if available

            // Update mostLeft and mostRight accordingly
            mostLeft = Math.min(mostLeft, fromLifelineLeft, toLifelineLeft);
            mostRight = Math.max(mostRight, fromLifelineRight, toLifelineRight);
        }
    });

    return { mostLeft, mostRight };
}

// Helper function to calculate the height of the fragment based on the number of messages
function calculateFragmentHeight(controlStructure) {
    const messageCount = controlStructure.messages.length;
    return CONTROL_STRUCTURE_HEADER_HEIGHT + (messageCount * MESSAGE_HEIGHT);
}

module.exports = { generateSequenceDiagram };
