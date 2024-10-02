// parsers/sequenceDiagramParser.js

const { sequenceDiagramArrows, generateGUID } = require('../utils/utils');

function parseParticipantsAndActors(line, participants, participantIndexMap) {
    const participantPattern = /^participant\s+(\w+)(?:\s+as\s+(\w+))?/;
    const actorPattern = /^actor\s+(\w+)(?:\s+as\s+(\w+))?/;

    let match = line.match(participantPattern);
    if (match) {
        const [_, name, alias] = match;
        const index = participants.length;

        const participant = { name: name, alias: alias || name, role: 'role', index: index };
        participants.push(participant);
        participantIndexMap[participant.name] = index;
        return;
    }

    match = line.match(actorPattern);
    if (match) {
        const [_, name, alias] = match;
        const index = participants.length;

        const participant = { name: name, alias: alias || name, role: 'actor', index: index };
        participants.push(participant);
        participantIndexMap[participant.name] = index;
    }
}

// Helper function to parse control structures
function parseControlStructures(line, controlStructures, currentControlStructure) {
    const loopPattern = /^loop\s+(.+)/;
    const breakPattern = /^break\s+(.+)/;
    const altPattern = /^alt\s+(.+)/;
    const elsePattern = /^else\s+(.+)/;
    const optPattern = /^opt\s+(.+)/;
    const endPattern = /^end/;

    if (loopPattern.test(line)) {
        const loopCondition = line.match(loopPattern)[1];
        const loopStructure = { 
            type: 'loop', 
            condition: loopCondition, 
            controlStructureId: generateGUID(), // Assign unique GUID
            branch: 'main' 
        };
        currentControlStructure.push(loopStructure);
        controlStructures.push(loopStructure);
    } else if (breakPattern.test(line)) {
        const breakCondition = line.match(breakPattern)[1];
        const breakStructure = { 
            type: 'break', 
            condition: breakCondition, 
            controlStructureId: generateGUID(), // Assign unique GUID
            branch: 'main' 
        };
        currentControlStructure.push(breakStructure);
        controlStructures.push(breakStructure);
    } else if (altPattern.test(line)) {
        const altCondition = line.match(altPattern)[1];
        const altStructure = { 
            type: 'alt', 
            condition: altCondition, 
            alternatives: [], 
            controlStructureId: generateGUID(), // Assign unique GUID for alt
            branch: 'alt' 
        };
        currentControlStructure.push(altStructure);
        controlStructures.push(altStructure);
    } else if (elsePattern.test(line)) {
        const lastAlt = currentControlStructure[currentControlStructure.length - 1];
        if (lastAlt && lastAlt.type === 'alt') {
            const elseStructure = { 
                type: 'else', 
                controlStructureId: generateGUID(), // Assign a separate GUID for else
                branch: 'else' 
            };
            lastAlt.alternatives.push(elseStructure);
            currentControlStructure.push(elseStructure); // Push the else structure for further message tracking
        }
    } else if (optPattern.test(line)) {
        const optCondition = line.match(optPattern)[1];
        const optStructure = { 
            type: 'opt', 
            condition: optCondition, 
            controlStructureId: generateGUID(), // Assign unique GUID for opt
            branch: 'main' 
        };
        currentControlStructure.push(optStructure);
        controlStructures.push(optStructure);
    } else if (endPattern.test(line)) {
        // End the most recent control structure
        currentControlStructure.pop();
    }
}

// Function to parse and handle specific lines (notes, activations, deactivations)
function parseSpecialLines(line, jsonResult) {
    const notePattern = /^note\s+(left|right)\s+of\s+(\w+):\s*(.+)$/i;
    const activatePattern = /^activate\s+(\w+)/i;
    const deactivatePattern = /^deactivate\s+(\w+)/i;

    // Handle note lines
    let match = line.match(notePattern);
    if (match) {
        const [_, position, participant, note] = match;
        jsonResult.notes.push({ position, participant, note });
        return true;
    }

    // Handle activation lines
    match = line.match(activatePattern);
    if (match) {
        jsonResult.activations.push({ type: 'activate', participant: match[1] });
        return true;
    }

    // Handle deactivation lines
    match = line.match(deactivatePattern);
    if (match) {
        jsonResult.activations.push({ type: 'deactivate', participant: match[1] });
        return true;
    }

    return false; // If it's not a special line, return false
}

// Helper function to parse messages and assign to control structures
function parseMessages(line, messages, participants, participantIndexMap, currentControlStructure) {
    const messagePattern = /^(\w+)\s*([<]{0,2}-{1,2}>>?|<-->|-{1,2}x|-)>\s*(\w+)\s*:\s*(.+)$/;
    const match = line.match(messagePattern);

    if (match) {
        const [_, from, arrow, to, message] = match;
        const fromIndex = participantIndexMap[from];
        const toIndex = participantIndexMap[to];

        const fromParticipant = participants[fromIndex];
        const toParticipant = participants[toIndex];

        let messageSort = 'synchCall';
        let direction = 'forward';

        const arrowType = sequenceDiagramArrows.arrows.find(entry => entry.pattern === arrow);
        if (arrowType) {
            messageSort = arrowType.type;
        }

        if (toIndex < fromIndex) {
            messageSort = 'reply';
            direction = 'backward';
        }

        // Assign the message to the nearest control structure by GUID
        let controlStructureId = null;
        if (currentControlStructure.length > 0) {
            const currentStructure = currentControlStructure[currentControlStructure.length - 1];
            controlStructureId = currentStructure.controlStructureId;  // Assign the GUID
        }

        const messageObj = {
            from: fromParticipant.name,
            to: toParticipant.name,
            message: message,
            type: messageSort,
            direction: direction,
            controlStructureId: controlStructureId // Use the GUID for reference
        };

        messages.push(messageObj);
    }
}

// Second pass: Track control structure state while parsing messages
function secondPassParseMessages(lines, jsonResult, participantIndexMap) {
    const controlStructureHistory = [];

    lines.forEach(line => {
        if (/^(loop|alt|opt|break|else|end)/.test(line)) {
            handleControlStructureTransitions(line, controlStructureHistory, jsonResult.controlStructures);
        } else {
            parseMessages(line, jsonResult.messages, jsonResult.participants, participantIndexMap, controlStructureHistory);
        }
    });
}

// Helper function to handle control structure state during the second pass
function handleControlStructureTransitions(line, controlStructureHistory, controlStructures) {
    const endPattern = /^end/;
    const elsePattern = /^else/;

    // Handle closing control structures
    if (endPattern.test(line)) {
        controlStructureHistory.pop(); // Close the most recent control structure
    } else if (elsePattern.test(line)) {
        // Find the last alt and switch to its else branch
        const lastAlt = controlStructureHistory[controlStructureHistory.length - 1];
        if (lastAlt && lastAlt.type === 'alt') {
            const elseBranch = lastAlt.alternatives.find(branch => branch.type === 'else');
            controlStructureHistory.push(elseBranch);
        }
    } else {
        // Find the corresponding control structure and push it to the history stack
        const controlStructure = controlStructures.find(cs => line.includes(cs.condition));
        if (controlStructure) {
            controlStructureHistory.push(controlStructure);
        }
    }
}

// Main parsing function for sequence diagrams
function parseSequenceDiagram(lines, jsonResult) {
    const participantIndexMap = {};
    jsonResult.participants = [];
    jsonResult.messages = [];
    jsonResult.controlStructures = [];
    jsonResult.notes = [];
    jsonResult.activations = [];

    const currentControlStructureStack = [];

    // First pass: Parse participants, control structures, and special lines (notes, activations, etc.)
    lines.forEach(line => {
        if (parseSpecialLines(line, jsonResult)) {
            return; // Skip to the next line if it's a special line
        }

        parseParticipantsAndActors(line, jsonResult.participants, participantIndexMap);

        if (/^(loop|alt|opt|break|else|end)/.test(line)) {
            parseControlStructures(line, jsonResult.controlStructures, currentControlStructureStack);
        }
    });

    // Second pass: Track control structure and assign messages to the correct branches
    secondPassParseMessages(lines, jsonResult, participantIndexMap);
}

module.exports = { parseSequenceDiagram };
