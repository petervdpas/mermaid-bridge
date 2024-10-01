# Mermaid Bridge Extension for StarUML

## Overview

This StarUML extension provides a two-way bridge for converting diagrams between Mermaid syntax and StarUML. It supports importing Mermaid class diagrams into StarUML and exporting StarUML class diagrams into Mermaid format. It can handle various relationships such as inheritance, associations, aggregations, compositions, and directed associations.

### Features

- **Import from Mermaid**: Convert a Mermaid class diagram into a StarUML model.
- **Export to Mermaid**: Convert a StarUML class diagram into Mermaid syntax.
- **Supported Mermaid Relationships**:
  - class-diagrams: `classDiagram`
    - Bidirectional Association: `<-->`
    - Undirected Association: `--`
    - Inheritance: `--|>` & `<|--`
    - Aggregation: `o--` & `--o`
    - Composition: `*--` & `--*`
    - Directed Association: `-->` & `<--`
  - entity-relationship-diagrams: `erDiagram`
    - IsStrong Relationship: `--`
    - IsWeak Relationship: `..`
    - Zero-Or-One Relationship: `|o` & `o|`
    - Exactly-One Relationship: `||` & `||`
    - Zero-Or-Many Relationship: `}o` & `o{`
    - One-Or-Many Relationship: `}|` & `|{`

## Installation

1. Download the extension files or clone this repository.
2. Move the folder to your StarUML extensions directory:
   - Windows: `%appdata%\StarUML\extensions\user`
   - macOS: `~/Library/Application Support/StarUML/extensions/user/`
   - Linux: `~/.config/StarUML/extensions/user/`
3. Restart StarUML.
4. The extension should appear under the `Tools` menu as "Mermaid Bridge".

## Usage

### Importing from Mermaid

1. Go to `Tools > Mermaid Bridge > Import from Mermaid`.
2. Paste or upload your Mermaid class diagram code.
3. The diagram will be converted into a StarUML class diagram and added to your project.

### Exporting to Mermaid

1. Go to `Tools > Mermaid Bridge > Export to Mermaid`.
2. The currently active class diagram in StarUML will be converted to Mermaid syntax.
3. The resulting Mermaid code will be displayed, ready to be copied or saved.

## StarUML Overview

StarUML is a software modeling tool that supports UML, ERD, and other diagrams. You can download StarUML from [staruml.io](https://staruml.io/) for Windows, macOS, and Linux.

To install extensions:

- Open StarUML.
- Go to Tools > Extension Manager.
- Search for "Mermaid Bridge" or install directly from the downloaded files.

## Example Mermaid Syntax

> You can try and edit the `mermaid-code` I added below, here (just copy&paste): [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor/). You can also find more examples in the [Mermaid documentation](https://mermaid.js.org/intro/).

**The following is an example of a CLASS diagram in Mermaid syntax:**

```mermaid
---
title: Cats and Dogs
author: Peter van de Pas
---
classDiagram
   class Animal {
      +String name
      +int age
      +void eat()
      -void sleep()
   }
   class Dog {
      +String breed
      +void bark()
      +void fetch()
   }
   class Cat {
      +String furColor
      +void meow()
      -void scratch()
   }
   class House {
      +String address
      +void openDoor()
   }
   class Room {
      +String name
      +void enter()
   }
   Dog --|> Animal
   Cat --|> Animal
   Dog <--> Cat : friendship
   Dog --> Cat : chases
   Cat --> Dog : scratches
   Dog *-- House : lives in
   Cat *-- House : lives in
   House o-- Room : contains
```

![Mermaid Class Diagram after moving stuff around](images/Mermaid-ClassDiagram.png)

> Mermaid Class Diagram... after moving stuff around

**The following is an example of a ER diagram in Mermaid syntax:**

```mermaid
---
title: Customer Orders
author: Peter van de Pas
---
erDiagram
    CUSTOMER {
        varchar name "length: 100, nullable: true"
        int age "nullable: true"
    }
    ORDER {
        varchar orderNumber "length: 20, nullable: true"
        date orderDate "nullable: true"
    }
    LINE-ITEM {
        int quantity "nullable: true"
        decimal price "nullable: true"
    }
    DELIVERY-ADDRESS {
        varchar street "length: 100, nullable: true"
        varchar city "length: 50, nullable: true"
        varchar postalCode "length: 10, nullable: true"
    }

    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

![Mermaid ER Diagram after moving stuff around](images/Mermaid-ERDiagram.png)

> Mermaid ER Diagram... after moving stuff around

**The following is an example of a Sequence diagram in Mermaid syntax:**

```mermaid
---
title: Database Authentication for Alice
author: Peter van de Pas
---
sequenceDiagram
    participant User as Alice
    participant System as Authentication System
    participant DB as Database

    Note right of User: Trying to log in

    User->>System: Enter username and password
    activate System
    alt Valid Credentials
        System->>DB: Check credentials
        activate DB
        DB-->>System: Credentials valid
        deactivate DB
        System-->>User: Login successful
    else Invalid Credentials
        System-->>User: Login failed
    end
    deactivate System

    opt Remember me selected
        System->>DB: Store session data
    end

    break When the database is down
        System->>User: Cannot connect to the database
    end

    Note left of DB: Self-check on data consistency
    DB->>DB: Run consistency check
    activate DB
    DB-->>DB: Fix inconsistencies
    deactivate DB
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue if you have any suggestions or improvements.

## License

This project is licensed under the MIT License.
