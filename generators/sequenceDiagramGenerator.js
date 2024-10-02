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

const { 
    createDiagram,
    createModel,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView
} = require('../umlFactory');

const { positionTracker, dimensionCalculator } = require('../utils/utils');

const FRAGMENT_HEADER_HEIGHT = 20;   // Height for the fragment header
const MESSAGE_HEIGHT = 50;           // Fixed height for each message
const SPACING_Y = 20;                // Space between messages or fragments on the Y-axis

// Initialize position trackers and dimension calculator
const lifelinePositionTracker = positionTracker({ x: 50, y: 20 }, 120, 0);  // X-axis increments for lifelines
const messagePositionTracker = positionTracker({ x: 0, y: 140 }, 0, MESSAGE_HEIGHT + SPACING_Y); // Y-axis increments for messages
const fragmentPositionTracker = positionTracker({ x: 0, y: 140 }, 0, FRAGMENT_HEADER_HEIGHT + SPACING_Y); // Y-axis increments for fragments
const fragmentDimensionCalculator = dimensionCalculator(); // Track fragment dimensions

const aliasMultiplier = 10;
const lifelinePositionMap = {}; // Store X positions of lifelines
const lifelineWidthMap = {};    // Store the calculated widths between lifelines

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

    // Step 1: Draw Lifelines and Calculate Widths
    parsedDiagram.participants.forEach((participant, index) => {
        const participantAlias = participant.alias || participant.name;
        const aliasWidth = participantAlias.length * aliasMultiplier;

        // Get current X position for this lifeline
        const { x: xPosition } = lifelinePositionTracker.getPosition();
        
        // Store the calculated width for this lifeline to the next
        if (index > 0) {
            const previousParticipant = parsedDiagram.participants[index - 1].name;
            lifelineWidthMap[previousParticipant] = xPosition - lifelinePositionMap[previousParticipant].left;
        }

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

        // Track the X position of the lifeline in lifelinePositionMap
        lifelinePositionMap[participant.name] = { left: xPosition };

        lifelineViewMap[participant.name] = lifelineView;

        // Increment the X position for the next lifeline
        lifelinePositionTracker.incrementPosition(aliasWidth + 50, 0);
    });

    // Step 2: Handle control structures and messages
    handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap);
}

// Step 3: Handle Messages and Fragments
function handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap) {
    let index = 0;

    while (index < parsedDiagram.messages.length) {
        const message = parsedDiagram.messages[index];

        const controlStructure = findControlStructureBeforeMessage(
            message.controlStructureId, parsedDiagram.controlStructures);

        if (controlStructure) {
            // Draw the fragment for the control structure
            drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram);

            // Remove the fragment after it is used, but do not remove the messages within
            parsedDiagram.controlStructures = parsedDiagram.controlStructures.filter(
                cs => cs.controlStructureId !== controlStructure.controlStructureId);
        } else {
            // Draw the message
            drawMessage(sequenceDiagram, message, lifelineViewMap);
        }

        // Increment the Y position after each message or fragment
        messagePositionTracker.incrementPosition(0, MESSAGE_HEIGHT + SPACING_Y);

        index++; // Ensure that the last message is included
    }
}

// Step 4: Draw a Fragment for a Control Structure
function drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram) {
    // Get the current Y position for this fragment
    const { y: fragmentYPosition } = fragmentPositionTracker.getPosition();

    // Find the X positions of the lifelines involved in this fragment
    const lifelinesInvolved = findMessagesByControlStructureId(controlStructure.controlStructureId, parsedDiagram.messages)
        .reduce((acc, message) => {
            if (!acc.includes(message.from)) acc.push(message.from);
            if (!acc.includes(message.to)) acc.push(message.to);
            return acc;
        }, []);

    const leftmostX = Math.min(...lifelinesInvolved.map(lifeline => lifelinePositionMap[lifeline].left));
    const rightmostX = Math.max(...lifelinesInvolved.map(lifeline => lifelinePositionMap[lifeline].left));

    // Get the messages associated with this control structure
    const relatedMessages = findMessagesByControlStructureId(controlStructure.controlStructureId, parsedDiagram.messages);

    // Calculate fragment height based on the number of messages and the header
    const fragmentHeight = FRAGMENT_HEADER_HEIGHT + (relatedMessages.length + 1) * MESSAGE_HEIGHT;

    // Set the fragment dimensions using the fragmentDimensionCalculator
    fragmentDimensionCalculator.setDimensions(leftmostX, fragmentYPosition, rightmostX, fragmentYPosition + fragmentHeight);

    // Create the combined fragment view
    const combinedFragment = createPositionedModelAndView({
        idType: "UMLCombinedFragment",
        parent: sequenceDiagram._parent,
        diagram: sequenceDiagram,
        x1: fragmentDimensionCalculator.getDimensions().x1,
        y1: fragmentDimensionCalculator.getDimensions().y1,
        x2: fragmentDimensionCalculator.getDimensions().x2,
        y2: fragmentDimensionCalculator.getDimensions().y2,
        dictionary: {
            name: controlStructure.type,
            condition: controlStructure.condition
        }
    });

    // Calculate the space between messages inside the fragment
    const messageSpacing = (fragmentHeight - FRAGMENT_HEADER_HEIGHT) / relatedMessages.length;

    // Draw messages inside the fragment, evenly spaced
    relatedMessages.forEach((message, index) => {
        const messageYPosition = fragmentYPosition + FRAGMENT_HEADER_HEIGHT + index * MESSAGE_HEIGHT;
        drawMessage(sequenceDiagram, message, lifelineViewMap, messageYPosition);
        parsedDiagram.messages = parsedDiagram.messages.filter(msg => msg !== message);
    });

    // Increment fragment position for the next fragment
    fragmentPositionTracker.incrementPosition(0, fragmentHeight + SPACING_Y);
}

// Step 5: Draw a Message
function drawMessage(sequenceDiagram, message, lifelineViewMap, messageYPosition = null) {
    const fromLifeline = lifelineViewMap[message.from];
    const toLifeline = lifelineViewMap[message.to];

    const fromX = lifelinePositionMap[message.from].left;
    const toX = lifelinePositionMap[message.to].left;

    // Use the provided Y position or the current message position
    const yPos = messageYPosition || messagePositionTracker.getPosition().y;

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
}

// Helper function to find a control structure before a specific message
function findControlStructureBeforeMessage(controlStructureId, controlStructures) {
    return controlStructures.find(cs => cs.controlStructureId === controlStructureId);
}

// Helper function to find messages associated with a control structure
function findMessagesByControlStructureId(controlStructureId, messages) {
    return messages.filter(msg => msg.controlStructureId === controlStructureId);
}

module.exports = { generateSequenceDiagram };
