// parsers/sequenceDiagramParser.js

// Helper function to parse participants and actors
function parseParticipantsAndActors(line, participants) {
    const participantPattern = /^participant\s+(\w+)(?:\s+as\s+(\w+))?/;
    const actorPattern = /^actor\s+(\w+)/;
    
    let match = line.match(participantPattern);
    if (match) {
        const [_, name, alias] = match;
        participants.push({ name: name, alias: alias || name });
        return;
    }

    match = line.match(actorPattern);
    if (match) {
        participants.push({ name: match[1], type: 'actor' });
    }
}

// Helper function to parse messages
function parseMessages(line, messages) {
    const messagePattern = /^(\w+)\s*(-{1,2}>>?)\s*(\w+)\s*:\s*(.+)$/;
    const match = line.match(messagePattern);
    if (match) {
        const [_, from, arrow, to, message] = match;
        const type = arrow.includes('>>') ? 'asynchronous' : 'synchronous';
        messages.push({
            from: from,
            to: to,
            message: message,
            type: type
        });
    }
}

// Helper function to parse self-messages
function parseSelfMessages(line, messages) {
    const selfMessagePattern = /^(\w+)\s*->\s*\1\s*:\s*(.+)$/;
    const match = line.match(selfMessagePattern);
    if (match) {
        const [_, participant, message] = match;
        messages.push({
            from: participant,
            to: participant,
            message: message,
            type: 'self'
        });
    }
}

// Helper function to parse loops, breaks, and control structures
function parseControlStructures(line, controlStructures) {
    const loopPattern = /^loop\s+(.+)/;
    const breakPattern = /^break\s+(.+)/;
    const altPattern = /^alt\s+(.+)/;
    const elsePattern = /^else\s+(.+)/;
    const optPattern = /^opt\s+(.+)/;
    const endPattern = /^end/;
    
    if (loopPattern.test(line)) {
        const loopCondition = line.match(loopPattern)[1];
        controlStructures.push({ type: 'loop', condition: loopCondition });
    } else if (breakPattern.test(line)) {
        const breakCondition = line.match(breakPattern)[1];
        controlStructures.push({ type: 'break', condition: breakCondition });
    } else if (altPattern.test(line)) {
        const altCondition = line.match(altPattern)[1];
        controlStructures.push({ type: 'alt', condition: altCondition });
    } else if (elsePattern.test(line)) {
        const elseCondition = line.match(elsePattern)[1];
        controlStructures.push({ type: 'else', condition: elseCondition });
    } else if (optPattern.test(line)) {
        const optCondition = line.match(optPattern)[1];
        controlStructures.push({ type: 'opt', condition: optCondition });
    } else if (endPattern.test(line)) {
        controlStructures.push({ type: 'end' });
    }
}

// Helper function to parse activations and deactivations
function parseActivations(line, activations) {
    const activatePattern = /^activate\s+(\w+)/;
    const deactivatePattern = /^deactivate\s+(\w+)/;
    const activateAsyncPattern = /^(\w+)->>\+(\w+)/;
    const deactivateAsyncPattern = /^(\w+)->>\-(\w+)/;

    let match = line.match(activatePattern);
    if (match) {
        activations.push({ type: 'activate', participant: match[1] });
        return;
    }

    match = line.match(deactivatePattern);
    if (match) {
        activations.push({ type: 'deactivate', participant: match[1] });
        return;
    }

    // Handle async activations with + and - notation
    match = line.match(activateAsyncPattern);
    if (match) {
        activations.push({ type: 'activateAsync', participant: match[2], from: match[1] });
        return;
    }

    match = line.match(deactivateAsyncPattern);
    if (match) {
        activations.push({ type: 'deactivateAsync', participant: match[2], from: match[1] });
    }
}

// Helper function to parse notes
function parseNotes(line, notes) {
    const notePattern = /^Note\s+(left|right)\s+of\s+(\w+):\s*(.+)$/;
    const match = line.match(notePattern);
    if (match) {
        const [_, position, participant, note] = match;
        notes.push({ position: position, participant: participant, note: note });
    }
}

// Main parsing function for sequence diagrams
function parseSequenceDiagram(lines, jsonResult) {

    // Initialize specific fields for a sequence diagram
    jsonResult.participants = [];
    jsonResult.messages = [];
    jsonResult.controlStructures = [];
    jsonResult.activations = [];
    jsonResult.notes = [];

    lines.forEach(line => {
        parseParticipantsAndActors(line, jsonResult.participants);
        parseMessages(line, jsonResult.messages);
        parseSelfMessages(line, jsonResult.messages);
        parseControlStructures(line, jsonResult.controlStructures);
        parseActivations(line, jsonResult.activations);
        parseNotes(line, jsonResult.notes);
    });
}

module.exports = { parseSequenceDiagram };
