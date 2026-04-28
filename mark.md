erDiagram
    USERS ||--|| PROFILES : has
    PROFILES ||--o{ USER_INVENTORY : owns
    PROFILES ||--o{ GARDEN_SLOTS : manages
    ITEMS ||--o{ USER_INVENTORY : "is in"
    ITEMS ||--o{ LOOTBOX_CONTENTS : "can drop from"
    LOOTBOXES ||--o{ LOOTBOX_CONTENTS : contains
    PLANT_TYPES ||--o{ GARDEN_SLOTS : defines

    PROFILES {
        uuid id PK
        int coins
        int total_xp
        int level
    }

    LOOTBOXES {
        int id PK
        string name
        int price
    }

    LOOTBOX_CONTENTS {
        int lootbox_id FK
        int item_id FK
        float probability
    }

    ITEMS {
        int id PK
        string name
        string rarity
    }
