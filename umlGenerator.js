// UMLGenerator.js

function addElement(elemType, parent, field, inElements) {
    app.factory.createModel({
        id: elemType,
        parent: parent,
        field: field,
        modelInitializer: function (elem) {
            elem.name = inElements.name;
            elem.type = inElements.type || inElements.returnType;
            elem.visibility = inElements.visibility;
        }
    });
}

function createRelationship(relation, tailView, headView, diagram) {

    if (!tailView || !headView) {
        app.toast.error("Parent or child class is missing.");
        return;
    }

    let elemType;

    // Bepaal het type relatie
    switch (relation.type) {
        case 'inheritance':
            elemType = "UMLGeneralization";
            break;
        case 'association':
        case 'directedAssociation':
        case 'bidirectionalAssociation':
        case 'aggregation':
        case 'composition':
            elemType = "UMLAssociation";
            break;
        default:
            // Onbekend relatie-type, geef een waarschuwing en stop
            app.toast.error(`Unknown relationship type: ${relation.type}`);
            console.warn(`Encountered unknown relationship type: ${relation.type}`);
            return; // Stop verdere verwerking als het type onbekend is
    }

    var options = {
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
    }

    var relationView = app.factory.createModelAndView(options);

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

function generateUML(parsedDiagram) {

    if (!parsedDiagram) {
        app.toast.error("Recieved NO mermaid code!");
        return;
    }

    if (parsedDiagram.type !== 'classDiagram') {
        app.toast.error("Class Diagram was not found!");
        return;
    }

    // Haal het project op
    var project = app.repository.select("@Project")[0];
    if (!project) {
        app.toast.error("No active project found.");
        return;
    }

    // Maak altijd een nieuw model en diagram aan
    var importClassModel = app.factory.createModel({
        id: "UMLModel",
        parent: project,
        modelInitializer: model => {
            model.name = "Imported Mermaid";
        }
    });

    var diagramOptions = {
        id: "UMLClassDiagram",
        parent: importClassModel,
        diagramInitializer: function (dgm) {
          dgm.name = "MermaidDiagram";
          dgm.defaultDiagram = true;
        }
      }
    var classDiagram = app.factory.createDiagram(diagramOptions);

    // Houd een mapping bij van klasse-namen naar UMLClass-objecten
    const classViewMap = {};

    // Voor elke klasse in het parsed diagram, maak een UMLClass aan
    parsedDiagram.classes.forEach(cls => {

        var newClass = app.factory.createModelAndView({
            id: "UMLClass",
            parent: classDiagram._parent,
            diagram: classDiagram,
            modelInitializer: function (elem) {
                elem.name = cls.name;
            }
        });

        classViewMap[cls.name] = newClass;

        // Voeg attributen toe
        cls.attributes.forEach(attr => {
            addElement("UMLAttribute", newClass.model, "attributes", attr);
        });

        // Voeg methoden toe
        cls.methods.forEach(method => {
            addElement("UMLOperation", newClass.model, "operations", method);
        });
    });

    // Verwerk relaties
    parsedDiagram.relationships.forEach(rel => {

        const tailView = classViewMap[rel.to];
        const headView = classViewMap[rel.from];

        createRelationship(rel, tailView, headView, classDiagram);
    });
}

module.exports = { generateUML };
