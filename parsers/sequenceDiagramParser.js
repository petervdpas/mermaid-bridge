// parsers/sequenceDiagramParser.js

const { sequenceDiagramArrows, generateGUID } = require('../utils/utils');

// Helper function to parse participants and actors
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
            controlStructureId: generateGUID(), 
            branch: 'main',
            messages: []
        };
        currentControlStructure.push(loopStructure);
        controlStructures.push(loopStructure);
    } else if (breakPattern.test(line)) {
        const breakCondition = line.match(breakPattern)[1];
        const breakStructure = { 
            type: 'break', 
            condition: breakCondition, 
            controlStructureId: generateGUID(), 
            branch: 'main',
            messages: [] 
        };
        currentControlStructure.push(breakStructure);
        controlStructures.push(breakStructure);
    } else if (altPattern.test(line)) {
        const altCondition = line.match(altPattern)[1];
        const altStructure = { 
            type: 'alt', 
            condition: altCondition, 
            alternatives: [], 
            controlStructureId: generateGUID(), 
            branch: 'alt',
            messages: []
        };
        currentControlStructure.push(altStructure);
        controlStructures.push(altStructure);
    } else if (elsePattern.test(line)) {
        const lastAlt = currentControlStructure[currentControlStructure.length - 1];
        if (lastAlt && lastAlt.type === 'alt') {
            const elseCondition = line.match(elsePattern)[1]
            const elseStructure = { 
                type: 'else', 
                condition: elseCondition,
                controlStructureId: generateGUID(), 
                branch: 'else',
                messages: []
            };
            lastAlt.alternatives.push(elseStructure);
            currentControlStructure.push(elseStructure); 
        }
    } else if (optPattern.test(line)) {
        const optCondition = line.match(optPattern)[1];
        const optStructure = { 
            type: 'opt', 
            condition: optCondition, 
            controlStructureId: generateGUID(), 
            branch: 'main',
            messages: []
        };
        currentControlStructure.push(optStructure);
        controlStructures.push(optStructure);
    } else if (endPattern.test(line)) {
        currentControlStructure.length = 0; // Clear the control structure history after end
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

// Helper function to parse messages
function parseMessages(line, messages, participants, participantIndexMap, controlStructureHistory) {
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

        // Assign the message to the nearest control structure by GUID, or null if no active control structure
        let controlStructureId = null;
        if (controlStructureHistory.length > 0) {
            controlStructureId = controlStructureHistory[controlStructureHistory.length - 1].controlStructureId;
        }

        const messageObj = {
            messageId: generateGUID(),
            from: fromParticipant.name,
            to: toParticipant.name,
            message: message,
            type: messageSort,
            direction: direction,
            controlStructureId: controlStructureId 
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

// Helper function to handle control structure transitions
function handleControlStructureTransitions(line, controlStructureHistory, controlStructures) {
    const endPattern = /^end/;
    const elsePattern = /^else/;

    if (endPattern.test(line)) {
        controlStructureHistory.length = 0; // Clear the control structure history after end
    } else if (elsePattern.test(line)) {
        const lastAlt = controlStructureHistory[controlStructureHistory.length - 1];
        if (lastAlt && lastAlt.type === 'alt') {
            const elseBranch = lastAlt.alternatives.find(branch => branch.type === 'else');
            controlStructureHistory.push(elseBranch);
        }
    } else {
        const controlStructure = controlStructures.find(cs => line.includes(cs.condition));
        if (controlStructure) {
            controlStructureHistory.push(controlStructure);
        }
    }
}

// Third pass: Add message IDs to the correct control structures
function thirdPassAssignMessagesToControlStructures(jsonResult) {
    const messages = jsonResult.messages;

    jsonResult.controlStructures.forEach(controlStructure => {
        if (controlStructure.type === 'alt') {
            // Handle alt and its alternatives (e.g., else)
            // Assign messages to the alt structure
            messages.forEach(message => {
                if (message.controlStructureId === controlStructure.controlStructureId) {
                    controlStructure.messages.push(message.messageId);
                }

                // Now handle alternatives within the alt (e.g., else)
                if (controlStructure.alternatives && Array.isArray(controlStructure.alternatives)) {
                    controlStructure.alternatives.forEach(altBranch => {
                        if (message.controlStructureId === altBranch.controlStructureId) {
                            altBranch.messages.push(message.messageId); // Push to the correct alternative branch
                        }
                    });
                }
            });
        } else {
            // For non-alt control structures, just assign messages as usual
            messages.forEach(message => {
                if (message.controlStructureId === controlStructure.controlStructureId) {
                    controlStructure.messages.push(message.messageId);
                }
            });
        }
    });
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
            return; 
        }

        parseParticipantsAndActors(line, jsonResult.participants, participantIndexMap);

        if (/^(loop|alt|opt|break|else|end)/.test(line)) {
            parseControlStructures(line, jsonResult.controlStructures, currentControlStructureStack);
        }
    });

    // Second pass: Assign messages to the correct control structure
    secondPassParseMessages(lines, jsonResult, participantIndexMap);

    // Third pass: Associate message IDs with their control structures
    thirdPassAssignMessagesToControlStructures(jsonResult);
}

module.exports = { parseSequenceDiagram };
