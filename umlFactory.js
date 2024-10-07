// umlFactory.js

const { translateSQLToERDType } = require('./utils/utils');

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

// Generic function to create a model and view, allowing one or many key-value pairs
function createModelAndView({ idType, parent, diagram, dictionary = {} }) {
    return app.factory.createModelAndView({
        id: idType,  // e.g., "UMLClass" or "ERDEntity"
        parent: parent,
        diagram: diagram,
        modelInitializer: function (elem) {
            Object.entries(dictionary).forEach(([key, value]) => {
                elem[key] = value;
            });
        }
    });
}

function createDirectedModelAndView({ idType, parent, diagram, from, to, dictionary = {} }) {
    return app.factory.createModelAndView({
        id: idType,  // e.g., "UMLClass" or "ERDEntity"
        parent: parent,
        diagram: diagram,
        tailView: from,
        headView: to,
        tailModel: from.model,
        headModel: to.model,
        modelInitializer: function (elem) {
            Object.entries(dictionary).forEach(([key, value]) => {
                elem[key] = value;
            });
        }
    });
}

// Generic function to create a model and view with a position, allowing one or many key-value pairs
function createPositionedModelAndView({ idType, parent, diagram, x1, y1, x2, y2, dictionary = {} }) {
    return app.factory.createModelAndView({
        id: idType,
        parent: parent,
        diagram: diagram,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        modelInitializer: function (elem) {
            Object.entries(dictionary).forEach(([key, value]) => {
                elem[key] = value;
            });
        }
    });
}

// Generic function to create a model and view with a position and directed connection, allowing one or many key-value pairs
function createPositionedDirectedModelAndView({ idType, parent, diagram, x1, y1, x2, y2, from, to, dictionary = {} }) {
    return app.factory.createModelAndView({
        id: idType,
        parent: parent,
        diagram: diagram,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        tailView: from,
        headView: to,
        tailModel: from.model,
        headModel: to.model,
        modelInitializer: function (elem) {
            Object.entries(dictionary).forEach(([key, value]) => {
                elem[key] = value;
            });
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

    var keys = inElements.keys || [];
    var properties = inElements.properties || {}; 

    console.log(inElements.type);
    
    app.factory.createModel({
        id: elemType,
        parent: parent,
        field: field,
        modelInitializer: function (elem) {
            elem.name = inElements.name;
            elem.type = translateSQLToERDType(inElements.type);
            elem.length = properties.length || '';
            elem.primaryKey = keys.includes('PK');
            elem.foreignKey = keys.includes('FK');
            elem.unique = keys.includes('UK');
            elem.nullable = properties.nullable || false;
        }
    });
}

module.exports = { 
    createDiagram,
    createModel,
    createModelAndView,
    createDirectedModelAndView,
    createPositionedModelAndView,
    createPositionedDirectedModelAndView,
    addClassElement,
    addERDElement
};
