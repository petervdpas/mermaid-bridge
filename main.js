// main.js

const { convertToUML } = require('./mermaidParser');
const { convertToMermaid } = require('./umlProcessor');
const { generateUML } = require('./umlGenerator');

function aboutMermaid() {
    app.dialogs.showInfoDialog(
        "Mermaid Bridge is a plugin for StarUML that allows you \n" +
        "to import and export UML diagrams using Mermaid syntax. \n" +
        "For more information, visit: \n" + 
        "https://github.com/petervdpas/mermaid-bridge");
}

function importMermaid() {
    app.dialogs.showTextDialog("Enter your Mermaid-diagram")
        .then(async function ({ buttonId, returnValue }) {
            if (buttonId === 'ok') {
                var mermaidCode = returnValue;

                if (mermaidCode) {
                    try {
                        var parsedDiagram = convertToUML(mermaidCode);
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
            app.toast.error("Could not convert model to Mermaid code or model type is unknown");
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
        "mermaid-bridge:about",
        aboutMermaid,
        "About Mermaid Bridge"
    );

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