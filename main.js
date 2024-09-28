// main.js

const { parseMermaidToJSON } = require('./mermaidParser');
const { convertToMermaid } = require('./umlProcess');
const { generateUML } = require('./umlGenerator');

function importMermaid() {
    app.dialogs.showTextDialog("Enter your Mermaid-diagram")
        .then(async function ({ buttonId, returnValue }) {
            if (buttonId === 'ok') {
                var mermaidCode = returnValue;

                if (mermaidCode) {
                    try {
                        var parsedDiagram = parseMermaidToJSON(mermaidCode);
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
    try {
        var selectedModels = app.selections.getSelectedModels()
        if (selectedModels.length === 0) {
            app.dialogs.showInfoDialog("No models selected");
            return;
        }
        var selectedModel = selectedModels[0];
        var mermaidCode = convertToMermaid(selectedModel);
        app.dialogs.showTextDialog("Generated Mermaid Code:", mermaidCode);
    }
    catch (err) {
        app.dialogs.showErrorDialog(err.message);
    }
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