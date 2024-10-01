// parsers/sequenceDiagramParser.js

const { sequenceDiagramArrows } = require('../utils/utils');

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

// Helper function to parse messages using sequenceDiagramArrows
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

        // Assign control structure index based on the active control structure
        let controlStructureIndex = null;
        if (currentControlStructure.length > 0) {
            const lastControlStructure = currentControlStructure[currentControlStructure.length - 1];
            controlStructureIndex = lastControlStructure.controlStructureIndex;  // Use explicit index
        }

        const messageObj = {
            from: fromParticipant.name,
            to: toParticipant.name,
            message: message,
            type: messageSort,
            direction: direction,
            controlStructureIndex: controlStructureIndex // Store index instead of null
        };

        messages.push(messageObj);
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
        const loopStructure = { type: 'loop', condition: loopCondition, messages: [], controlStructureIndex: controlStructures.length };
        currentControlStructure.push(loopStructure);
        controlStructures.push(loopStructure);
    } else if (breakPattern.test(line)) {
        const breakCondition = line.match(breakPattern)[1];
        const breakStructure = { type: 'break', condition: breakCondition, messages: [], controlStructureIndex: controlStructures.length };
        currentControlStructure.push(breakStructure);
        controlStructures.push(breakStructure);
    } else if (altPattern.test(line)) {
        const altCondition = line.match(altPattern)[1];
        const altStructure = { type: 'alt', condition: altCondition, messages: [], alternatives: [], controlStructureIndex: controlStructures.length };
        currentControlStructure.push(altStructure);
        controlStructures.push(altStructure);
    } else if (elsePattern.test(line)) {
        const lastAlt = currentControlStructure[currentControlStructure.length - 1];
        if (lastAlt && lastAlt.type === 'alt') {
            const elseStructure = { type: 'else', messages: [], controlStructureIndex: controlStructures.length };
            lastAlt.alternatives.push(elseStructure);
        }
    } else if (optPattern.test(line)) {
        const optCondition = line.match(optPattern)[1];
        const optStructure = { type: 'opt', condition: optCondition, messages: [], controlStructureIndex: controlStructures.length };
        currentControlStructure.push(optStructure);
        controlStructures.push(optStructure);
    } else if (endPattern.test(line)) {
        const finishedStructure = currentControlStructure.pop();
        if (currentControlStructure.length > 0) {
            currentControlStructure[currentControlStructure.length - 1].messages.push(finishedStructure);
        }
    }
}

// Function to parse and handle specific lines (notes, activations, deactivations)
function parseSpecialLines(line, jsonResult) {
    // Patterns for notes, activations, and deactivations
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

// Main parsing function for sequence diagrams
function parseSequenceDiagram(lines, jsonResult) {
    const participantIndexMap = {};
    jsonResult.participants = [];
    jsonResult.messages = [];
    jsonResult.controlStructures = [];
    jsonResult.notes = [];
    jsonResult.activations = [];

    const currentControlStructureStack = [];

    lines.forEach(line => {
        // Skip and parse special lines (notes, activations, deactivations)
        if (parseSpecialLines(line, jsonResult)) {
            return; // Skip to the next line if it's a special line
        }

        // Parse participants, actors, control structures, and messages
        parseParticipantsAndActors(line, jsonResult.participants, participantIndexMap);

        if (/^(loop|alt|opt|break|else|end)/.test(line)) {
            parseControlStructures(line, jsonResult.controlStructures, currentControlStructureStack);
        } else {
            parseMessages(line, jsonResult.messages, jsonResult.participants, participantIndexMap, currentControlStructureStack);
        }
    });
}

module.exports = { parseSequenceDiagram };
