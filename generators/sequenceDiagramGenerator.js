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
const MESSAGE_HEIGHT = 50;

const lifelinePositionMap = {};
const lifelineViewMap = {};

// Initialize position and dimension trackers
const lifelinePositionTracker = positionTracker({ x: 50, y: 120 });
const messagePositionTracker = positionTracker({ x: 0, y: 150 }, 0, MESSAGE_HEIGHT);

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
        const { x } = lifelinePositionTracker.getPosition();
        const y = 20;

        const lifelineView = createPositionedModelAndView({
            idType: "UMLLifeline",
            parent: sequenceDiagram._parent, 
            diagram: sequenceDiagram,
            x1: x + accumulatedMargin,
            y1: y,
            x2: x + accumulatedMargin,
            y2: y,
            dictionary: {
                name: participantAlias
            }
        });

        const role = lifelineView.model.represent;
        if (role) {
            app.engine.setProperty(role, 'name', participant.name);
        }

        lifelinePositionMap[participant.name] = { left: x, top: y };

        lifelineViewMap[participant.name] = lifelineView;

        // Increment margin based on lifeline margin and name length
        accumulatedMargin += LIFELINE_MARGIN + (nameLength + LIFELINE_NAME_MARGIN);

        // Increment X position for the next participant
        lifelinePositionTracker.incrementPosition(accumulatedMargin, 0);
    });

    console.log(lifelinePositionMap);

    // Handle control structures and messages
    handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap);
}


// Function to handle control structures and their associated messages
function handleMessagesAndControlStructures(sequenceDiagram, parsedDiagram, lifelineViewMap) {

    while (parsedDiagram.messages.length > 0) {
        const message = parsedDiagram.messages[0];

        if (message.controlStructureId) {
            const controlStructure = parsedDiagram.controlStructures.find(
                cs => cs.controlStructureId === message.controlStructureId);

            console.log(controlStructure);
            //drawCombinedFragment(sequenceDiagram, controlStructure, lifelineViewMap, parsedDiagram, globalYPosition);
        } else {
            const { yPos } = messagePositionTracker.getPosition();
            drawMessage(sequenceDiagram, message, lifelineViewMap, yPos);
            messagePositionTracker.incrementPosition(0, MESSAGE_HEIGHT);
        }

        parsedDiagram.messages.shift();
    }
}

// Function to draw a message
function drawMessage(sequenceDiagram, message, lifelineViewMap, yPos) {
    const fromLifeline = lifelineViewMap[message.from];
    const toLifeline = lifelineViewMap[message.to];

    const fromX = lifelinePositionMap[message.from].left;
    const toX = lifelinePositionMap[message.to].left;

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

module.exports = { generateSequenceDiagram };
