const { parseMermaidToJSON } = require('./mermaidParser');
const { generateUML } = require('./umlGenerator');

function importMermaid() {
    app.dialogs.showTextDialog("Enter your Mermaid-diagram")
        .then(async function ({ buttonId, returnValue }) {
            if (buttonId === 'ok') {
                const mermaidCode = returnValue;

                if (mermaidCode) {
                    try {
                        const parsedDiagram = parseMermaidToJSON(mermaidCode);
                        console.log("Parsed Mermaid-diagram:", parsedDiagram);
                        generateUML(parsedDiagram);
                    } catch (err) {
                        app.dialogs.showErrorDialog(err.message);
                    }
                }
            } else {
                app.dialogs.showInfoDialog("Input was cancelled")
            }
        });
}

function exportToMermaid() {

    /*
    const umlData = app.repository.select();  // Selecteer UML-objecten
    const mermaidCode = convertToMermaid(umlData);
    console.log(mermaidCode);
    */

    app.dialogs.showInfoDialog("Export to Mermaid is not implemented just yet.");
}

function init() {

    app.commands.register(
        "mermaid-bridge:import",
        importMermaid,
        "Import from Mermaid"
    );

    app.commands.register(
        "mermaid-bridge:export",
        exportToMermaid,
        "Export to Mermaid"
    );
}

exports.init = init;