// umlGenerator.js

const { generateClassDiagram } = require('./generators/classDiagramGenerator');
const { generateERDiagram } = require('./generators/erDiagramGenerator');
const { generateSequenceDiagram } = require('./generators/sequenceDiagramGenerator');

function generateUML(parsedDiagram) {
    if (!parsedDiagram) {
        app.toast.error("Received NO mermaid code!");
        return;
    }

    // Fetch the project
    const project = app.repository.select("@Project")[0];
    if (!project) {
        app.toast.error("No active project found.");
        return;
    }

    // Handle different types of diagrams
    switch (parsedDiagram.type) {
        case 'classDiagram':
            generateClassDiagram(project, parsedDiagram);
            break;
        
        case 'erDiagram':
            generateERDiagram(project, parsedDiagram);
            break;

        case 'sequenceDiagram':
            generateSequenceDiagram(project, parsedDiagram);
            break;

        default:
            app.toast.error(`Unsupported diagram type: ${parsedDiagram.type}`);
            return;
    }
}

module.exports = { generateUML };
