// umlFactory.js

const { translateType } = require('./utils/utils');

// Generic function to create a diagram
function createDiagram({ idType, parent, name, defaultDiagram = false }) {
    return app.factory.createDiagram({
        id: idType,  // e.g., "UMLClassDiagram", "ERDClassDiagram"
        parent: parent,
        diagramInitializer: function (dgm) {
            dgm.name = name;  // Set the name of the diagram
            dgm.defaultDiagram = defaultDiagram;  // Set if it's the default diagram
        }
    });
}

// Generic function to create a model (e.g., UMLModel, ERDModel)
function createModel({ idType, parent, name }) {
    return app.factory.createModel({
        id: idType,  // e.g., "UMLModel", "ERDModel"
        parent: parent,
        modelInitializer: function (model) {
            model.name = name;  // Set the name of the model
        }
    });
}

// Generic function to create a model and view for UMLClass or ERDEntity
function createModelAndView({ idType, parent, diagram, nameKey, nameValue }) {
    return app.factory.createModelAndView({
        id: idType,  // e.g., "UMLClass" or "ERDEntity"
        parent: parent,
        diagram: diagram,
        modelInitializer: function (elem) {
            elem[nameKey] = nameValue;  // Use the passed key-value for name
        }
    });
}

// Generic function to add elements (e.g., attributes, methods) to a UML class
function addClassElement(elemType, parent, field, inElements) {
    app.factory.createModel({
        id: elemType, // e.g., "UMLAttribute", "UMLOperation"
        parent: parent,
        field: field, // e.g., "attributes" or "operations"
        modelInitializer: function (elem) {
            elem.name = inElements.name;
            elem.type = inElements.type || inElements.returnType;
            elem.visibility = inElements.visibility;
        }
    });
}

// Generic function to add elements (columns) to an ERD entity
function addERDElement(elemType, parent, field, inElements) {

    var properties = inElements.properties;

    app.factory.createModel({
        id: elemType,
        parent: parent,
        field: field,
        modelInitializer: function (elem) {
            elem.name = inElements.name;
            elem.type = translateType(inElements.type);
            elem.length = properties.length || '';
            elem.nullable = properties.nullable || false;
        }
    });
}

module.exports = { 
    createDiagram,
    createModel,
    createModelAndView,
    addClassElement,
    addERDElement
};
