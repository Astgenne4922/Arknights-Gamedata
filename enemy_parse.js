import fs from "fs";

const BASE_URL = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata`;

const enemy_handbook_table = await fetch(`${BASE_URL}/excel/enemy_handbook_table.json`).then((r) =>
    r.json()
);
const enemy_database = await fetch(`${BASE_URL}/levels/enemydata/enemy_database.json`).then((r) =>
    r.json()
);

const full_json = Object.entries(enemy_handbook_table.enemyData).reduce(
    (acc, [code, enemyObject]) => {
        const database = enemy_database.find((obj) => obj.Key === code).Value[0].enemyData;

        acc[code] = {
            name: enemyObject.name,
            tag: enemyObject.enemyIndex,
            description: enemyObject.description,
            rank: enemyObject.enemyLevel,
            damageTypes: enemyObject.damageType,

            rangeType: database.applyWay.m_value,
            movement: database.motion.m_value,

            lifePenality: database.lifePointReduce.m_value,
        };

        acc[code].abilities = Object.values(enemyObject.abilityList);

        if (database.enemyTags.m_defined && database.enemyTags.m_value)
            acc[code].categories = Object.values(database.enemyTags.m_value).map(
                (v) => enemy_handbook_table.raceData[v].raceName
            );
        else acc[code].categories = [];

        for (let i = enemy_handbook_table.levelInfoList.length - 1; i >= 0; i--) {
            if (
                database.attributes.maxHp.m_value >= enemy_handbook_table.levelInfoList[i].maxHP.min
            )
                acc[code].hp = enemy_handbook_table.levelInfoList[i].classLevel;

            if (database.attributes.atk.m_value >= enemy_handbook_table.levelInfoList[i].attack.min)
                acc[code].atk = enemy_handbook_table.levelInfoList[i].classLevel;

            if (database.attributes.def.m_value >= enemy_handbook_table.levelInfoList[i].def.min)
                acc[code].def = enemy_handbook_table.levelInfoList[i].classLevel;

            if (
                database.attributes.magicResistance.m_value >=
                enemy_handbook_table.levelInfoList[i].magicRes.min
            )
                acc[code].res = enemy_handbook_table.levelInfoList[i].classLevel;

            if (
                database.attributes.moveSpeed.m_value >=
                enemy_handbook_table.levelInfoList[i].moveSpeed.min
            )
                acc[code].speed = enemy_handbook_table.levelInfoList[i].classLevel;

            if (
                database.attributes.epDamageResistance.m_value >=
                enemy_handbook_table.levelInfoList[i].enemyDamageRes.min
            )
                acc[code].eRes = enemy_handbook_table.levelInfoList[i].classLevel;

            if (
                database.attributes.epResistance.m_value >=
                enemy_handbook_table.levelInfoList[i].enemyRes.min
            )
                acc[code].eRst = enemy_handbook_table.levelInfoList[i].classLevel;
        }

        enemy_handbook_table.levelInfoList.forEach((l) => {
            if (database.attributes.baseAttackTime.m_value >= l.attackSpeed.min)
                acc[code].aspd = l.classLevel;
        });

        acc[code].weight = database.attributes.massLevel.m_value;

        acc[code].statusImmunities = Object.entries(database.attributes)
            .filter(([key, _]) => key.endsWith("Immune"))
            .reduce((obj, [statusName, isImmune]) => {
                obj[statusName.replace("Immune", "")] = isImmune.m_value;
                return obj;
            }, {});

        fs.mkdirSync(`./enemies/${code}`, { recursive: true });
        fs.writeFile(
            `./enemies/${code}/enemy.json`,
            JSON.stringify(acc[code], null, 4),
            "utf-8",
            () => {}
        );

        return acc;
    },
    {}
);

fs.mkdirSync("./enemies", { recursive: true });
fs.writeFile(
    "./enemies/enemiy_codes.json",
    JSON.stringify(Object.keys(full_json).sort(), null, 4),
    "utf-8",
    () => {}
);
