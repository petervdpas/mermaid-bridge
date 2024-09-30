// umlProcessor.js

const { appendClassDiagamToMermaid } = require('./uml-processors/classDiagramProcessor');
const { appendERDiagamToMermaid } = require('./uml-processors/erDiagramProcessor');

function convertToMermaid(model) {

    let mermaidCode = '';

    switch (true) {
        case model instanceof type.UMLModel:
            mermaidCode += appendClassDiagamToMermaid(model);
            break;

        case model instanceof type.ERDDataModel:
            mermaidCode += appendERDiagamToMermaid(model);
            break;

        default:
            return '';  // Return an empty string if the model type is unknown
    }

    return mermaidCode;
}

module.exports = { convertToMermaid };
