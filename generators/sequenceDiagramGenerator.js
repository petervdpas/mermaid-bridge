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

    // Step 2: Create Lifelines and Messages
    const lifelineViewMap = {};

    // Create lifelines for each participant in the parsed diagram
    parsedDiagram.participants.forEach((participant, index) => {

        var participantAlias = participant.alias || participant.name;
        const aliasWidth = participantAlias.length * aliasMultiplier;

        const xPosition = currentXPosition + (index * 120);

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

        // Store the lifeline position for later use in messages
        lifelinePositionMap[participant.name] = {
            left: xPosition,  // Store X position
            top: currentYPosition // Start messages below the lifeline
        };

        // Rename the associated role created with the lifeline
        const role = lifelineView.model.represent;
        if (role) {
            role.name = participant.name;  // Rename the role to the participant's name
        }

        lifelineViewMap[participant.name] = lifelineView;

        currentXPosition += aliasWidth + 50;
    });

    // Create messages between lifelines
    parsedDiagram.messages.forEach((message, index) => {
        const fromLifeline = lifelineViewMap[message.from];
        const toLifeline = lifelineViewMap[message.to];

        // Get the X positions of the lifelines
        const fromX = lifelinePositionMap[message.from].left;
        const toX = lifelinePositionMap[message.to].left;

        const messageView = createPositionedDirectedModelAndView({
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

        // Increment the Y position for the next message
        currentYPosition += 50;
    });

    // Handle control structures (loops, breaks, alt, etc.)
    // parsedDiagram.controlStructures.forEach(controlStructure => {
    //     // Create a UMLCombinedFragment for control structures like loops, alt, opt, etc.
    //     const fragmentView = createPositionedModelAndView({
    //         idType: "UMLCombinedFragment",
    //         parent: sequenceDiagram._parent,
    //         diagram: sequenceDiagram,
    //         x1: 100,  // Hardcoded positions for now
    //         y1: currentYPosition,
    //         x2: 600,  // Span across the diagram horizontally
    //         y2: currentYPosition + 100,  // Vertical space for the fragment
    //         dictionary: {
    //             name: controlStructure.type,
    //         }
    //     });
    
    //     // If it's an "alt", create interaction operands for each alternative path
    //     if (controlStructure.type === 'alt' && controlStructure.alternatives) {
    //         controlStructure.alternatives.forEach(altCondition => {
    //             createPositionedModelAndView({
    //                 idType: "UMLInteractionOperand",
    //                 parent: fragmentView.model,  // The operand belongs inside the fragment
    //                 diagram: sequenceDiagram,
    //                 x1: 100,
    //                 y1: currentYPosition,
    //                 x2: 600,
    //                 y2: currentYPosition + 50,  // Adjust height for each operand
    //                 dictionary: {
    //                     name: "else",  // Each alternative
    //                     condition: altCondition  // Condition text
    //                 }
    //             });
    //             currentYPosition += 50;  // Move the Y position for the next operand
    //         });
    //     } else if (controlStructure.type === 'loop' || controlStructure.type === 'opt') {
    //         // Create a single operand for loop or opt
    //         createPositionedModelAndView({
    //             idType: "UMLInteractionOperand",
    //             parent: fragmentView.model,  // Operand belongs to the fragment
    //             diagram: sequenceDiagram,
    //             x1: 100,
    //             y1: currentYPosition,
    //             x2: 600,
    //             y2: currentYPosition + 100,
    //             dictionary: {
    //                 name: controlStructure.type,
    //                 condition: controlStructure.condition
    //             }
    //         });
    //         currentYPosition += 100;  // Adjust Y position after loop/opt block
    //     }
    
    //     currentYPosition += 100;  // Move the Y position after the whole fragment
    // });

    // });

        /*

    // Handle activations and deactivations
    parsedDiagram.activations.forEach(activation => {
        const participantLifeline = lifelineViewMap[activation.participant];

        createModelAndView({
            idType: activation.type === 'activate' ? "UMLActivation" : "UMLDeactivation",
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "participant",
            nameValue: participantLifeline.name
        });
    });

    // Handle notes
    parsedDiagram.notes.forEach(note => {
        const participantLifeline = lifelineViewMap[note.participant];
        
        createModelAndView({
            idType: "UMLNote",
            parent: sequenceDiagram,
            diagram: sequenceDiagram,
            nameKey: "note",
            nameValue: note.note,
            position: note.position,  // left or right
            attachedTo: participantLifeline
        });
    });
*/
}

module.exports = { generateSequenceDiagram };