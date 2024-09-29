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

// Generic function to create relationships between UML elements
function createRelationship(relation, tailView, headView, diagram) {

    if (!tailView || !headView) {
        app.toast.error("Parent or child class is missing.");
        return;
    }

    const relationMap = {
        'inheritance': "UMLGeneralization",
        'association': "UMLAssociation",
        'directedAssociation': "UMLAssociation",
        'bidirectionalAssociation': "UMLAssociation",
        'aggregation': "UMLAssociation",
        'composition': "UMLAssociation"
    };

    let elemType = relationMap[relation.type];

    if (!elemType) {
        app.toast.error(`Unknown relationship type: ${relation.type}`);
        console.warn(`Unknown relationship type: ${relation.type}`);
        return;
    }

    const options = {
        id: elemType,
        parent: diagram._parent,
        diagram: diagram,
        tailView: tailView,
        headView: headView,
        tailModel: tailView.model,
        headModel: headView.model,
        modelInitializer: function (elem) {
            elem.name = relation.label;
        }
    };

    const relationView = app.factory.createModelAndView(options);

    switch (relation.type) {
        case 'directedAssociation':
            relationView.model.end1.navigable = "navigable";
            break;
        case 'bidirectionalAssociation':
            relationView.model.end1.navigable = "navigable";
            relationView.model.end2.navigable = "navigable";
            break;
        case 'aggregation':
            relationView.model.end2.aggregation = "shared";
            break;
        case 'composition':
            relationView.model.end2.aggregation = "composite";
            break;
    }
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
    app.factory.createModel({
        id: elemType,
        parent: parent,
        field: field,
        modelInitializer: function (elem) {
            elem.name = inElements.name;
            elem.type = translateType(inElements.type);
            //elem.length = inElements.Length;
            //elem.nullable = inElements.IsNullable;
        }
    });
}

module.exports = { 
    createDiagram, 
    createModel, 
    createModelAndView, 
    createRelationship, 
    addClassElement, 
    addERDElement };
