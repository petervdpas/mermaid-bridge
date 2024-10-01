// parsers/sequenceDiagramParser.js

const { sequenceDiagramArrows } = require('../utils/utils');

// Helper function to parse participants and assign roles (actor or regular participant)
function parseParticipantsAndActors(line, participants, participantIndexMap) {
    const participantPattern = /^participant\s+(\w+)(?:\s+as\s+(\w+))?/;
    const actorPattern = /^actor\s+(\w+)(?:\s+as\s+(\w+))?/; // Actors can also have an alias

    let match = line.match(participantPattern);
    if (match) {
        const [_, name, alias] = match;
        const index = participants.length;  // Calculate the index based on current order (lines)

        const participant = { 
            name: name, 
            alias: alias || name, 
            role: 'role',  // Assign "role" as their type
            index: index  // Store index in the object itself
        };
        
        participants.push(participant);
        participantIndexMap[participant.name] = index; // Map participant name to index
        return;
    }

    match = line.match(actorPattern);
    if (match) {
        const [_, name, alias] = match;
        const index = participants.length;  // Calculate the index based on current order (lines)

        const participant = { 
            name: name, 
            alias: alias || name, 
            role: 'actor',  // Assign "actor" as their role
            index: index  // Store index in the object itself
        };
        
        participants.push(participant);
        participantIndexMap[participant.name] = index; // Map participant name to index
    }
}

// Helper function to parse messages using sequenceDiagramArrows
function parseMessages(line, messages, participants, participantIndexMap) {
    const messagePattern = /^(\w+)\s*([<]{0,2}-{1,2}>>?|<-->|-{1,2}x|-)>\s*(\w+)\s*:\s*(.+)$/;
    const match = line.match(messagePattern);
    
    if (match) {
        const [_, from, arrow, to, message] = match;
        const fromIndex = participantIndexMap[from];
        const toIndex = participantIndexMap[to];

        // Retrieve participant details from the `participants` array
        const fromParticipant = participants[fromIndex];
        const toParticipant = participants[toIndex];

        let messageSort = 'synchCall'; // Default to synchronous call
        let direction = 'forward';  // Default direction

        // Identify the message type based on arrow
        const arrowType = sequenceDiagramArrows.arrows.find(entry => entry.pattern === arrow);
        if (arrowType) {
            messageSort = arrowType.type;
        }

        // Determine if this is a reply message (if the indices suggest a reverse direction)
        if (toIndex < fromIndex) {
            messageSort = 'reply';
            direction = 'backward'; // Reverse direction (StarUML handles replies in reverse)
        }

        // Push the parsed message with participant roles/aliases and other details
        messages.push({
            from: fromParticipant.name, // Participant name or alias
            to: toParticipant.name, // Participant name or alias
            message: message,
            type: messageSort,  // The StarUML message sort type
            direction: direction  // Forward or reverse
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

// Main parsing function for sequence diagrams
function parseSequenceDiagram(lines, jsonResult) {
    const participantIndexMap = {};  // Initialize index map for participants

    // Initialize specific fields for a sequence diagram
    jsonResult.participants = [];
    jsonResult.messages = [];
    jsonResult.controlStructures = [];

    lines.forEach(line => {
        parseParticipantsAndActors(line, jsonResult.participants, participantIndexMap);
        parseMessages(line, jsonResult.messages, jsonResult.participants, participantIndexMap);
        parseControlStructures(line, jsonResult.controlStructures);
    });
}

module.exports = { parseSequenceDiagram };
