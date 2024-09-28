// UMLGenerator.js

const { createDiagram, createModel, createModelAndView, addElement, createRelationship } = require('./umlFactory');

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
    var importClassModel = createModel({
        idType: "UMLModel",
        parent: project,
        name: "Imported Class Model"
    });

    var classDiagram = createDiagram({
        idType: "UMLClassDiagram",
        parent: importClassModel,
        name: "Mermaid Class Diagram",
        defaultDiagram: true
    });

    // Houd een mapping bij van klasse-namen naar UMLClass-objecten
    const classViewMap = {};

    // Voor elke klasse in het parsed diagram, maak een UMLClass aan
    parsedDiagram.classes.forEach(cls => {

        var newClass = createModelAndView({
            idType: "UMLClass",
            parent: classDiagram._parent,
            diagram: classDiagram,
            nameKey: "name",
            nameValue: cls.name
        }) 

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
