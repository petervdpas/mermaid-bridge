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
                        app.toast.error(err.message);
                    }
                }
            } else {
                app.toast.info("Input was cancelled")
            }
        });
}

function exportToMermaid() {
    try {
        var selectedModels = app.selections.getSelectedModels()
        if (selectedModels.length === 0) {
            app.toast.info("No models selected");
            return;
        }
        var selectedModel = selectedModels[0];
        var mermaidCode = convertToMermaid(selectedModel);

        if (!mermaidCode) {
            app.toast.error("Could not convert model to Mermaid code");
            return;
        }
        
        app.dialogs.showTextDialog("Generated Mermaid Code:", mermaidCode);
    }
    catch (err) {
        app.toast.error(err.message);
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