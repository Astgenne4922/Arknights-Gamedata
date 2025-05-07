import fs from "fs";

const BASE_URL = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata`;

const enemy_handbook_table = await fetch(`${BASE_URL}/excel/enemy_handbook_table.json`).then((r) =>
    r.json()
);
const enemy_database = await fetch(`${BASE_URL}/levels/enemydata/enemy_database.json`).then((r) =>
    r.json()
);

const outer_array = [];

Object.entries(enemy_handbook_table.enemyData).forEach(([code, enemyObject]) => {
    if (enemyObject.hideInHandbook) return;

    outer_array.push({ code: code, name: enemyObject.name });

    const database = enemy_database.find((obj) => obj.Key === code).Value[0].enemyData;

    // TODO rimuovere i rich text styles
    // TODO aggiungi al file generale modi per filtrare (vedi gioco)
    // TODO trova modo per filtrare per evento (da valutare)

    const acc = {
        name: enemyObject.name,
        tag: enemyObject.enemyIndex,
        description: enemyObject.description,
        rank: enemyObject.enemyLevel,
        damageTypes: enemyObject.damageType,

        rangeType: database.applyWay.m_value,

        lifePenality: database.lifePointReduce.m_value,
    };

    acc.abilities = Object.values(enemyObject.abilityList);

    if (database.enemyTags.m_defined && database.enemyTags.m_value)
        acc.categories = Object.values(database.enemyTags.m_value).map(
            (v) => enemy_handbook_table.raceData[v].raceName
        );
    else acc.categories = [];

    for (let i = enemy_handbook_table.levelInfoList.length - 1; i >= 0; i--) {
        if (database.attributes.maxHp.m_value >= enemy_handbook_table.levelInfoList[i].maxHP.min)
            acc.hp = enemy_handbook_table.levelInfoList[i].classLevel;

        if (database.attributes.atk.m_value >= enemy_handbook_table.levelInfoList[i].attack.min)
            acc.atk = enemy_handbook_table.levelInfoList[i].classLevel;

        if (database.attributes.def.m_value >= enemy_handbook_table.levelInfoList[i].def.min)
            acc.def = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.magicResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].magicRes.min
        )
            acc.res = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.moveSpeed.m_value >=
            enemy_handbook_table.levelInfoList[i].moveSpeed.min
        )
            acc.speed = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.epDamageResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].enemyDamageRes.min
        )
            acc.eRes = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.epResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].enemyRes.min
        )
            acc.eRst = enemy_handbook_table.levelInfoList[i].classLevel;
    }

    enemy_handbook_table.levelInfoList.forEach((l) => {
        if (database.attributes.baseAttackTime.m_value >= l.attackSpeed.min)
            acc.aspd = l.classLevel;
    });

    acc.weight = database.attributes.massLevel.m_value;

    acc.statusImmunities = Object.entries(database.attributes)
        .filter(([key, _]) => key.endsWith("Immune"))
        .reduce((obj, [statusName, isImmune]) => {
            obj[statusName.replace("Immune", "")] = isImmune.m_value;
            return obj;
        }, {});

    fs.mkdirSync(`./enemies/${code}`, { recursive: true });
    fs.writeFile(`./enemies/${code}/enemy.json`, JSON.stringify(acc, null, 4), "utf-8", () => {});
});

fs.mkdirSync("./enemies", { recursive: true });
fs.writeFile("./enemies/enemy_codes.json", JSON.stringify(outer_array, null, 4), "utf-8", () => {});
